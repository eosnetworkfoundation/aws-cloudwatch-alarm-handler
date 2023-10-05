const is = require('./is.js');
const joi = require('joi');
const moment = require('moment-timezone');
const pkg = require('./package.json');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

/* joi schema */
// schema of a CloudWatch alarm state
const cloudwatchAlarmStateSchema = joi.object({
    reason: joi.string().required(),
    reasonData: joi.string().required(),
    timestamp: joi.string().isoDate().required(),
    value: joi.string().valid('ALARM', 'INSUFFICIENT_DATA', 'OK').required(),
}).unknown();

// schema of an unpacked CloudWatch alarm state change event
const cloudwatchEventSchema = joi.object({
    account: joi.string().pattern(/^[0-9]+$/).required(),
    detail: joi.object({
        alarmName: joi.string().required(),
        configuration: joi.object({
            description: joi.string().allow(null).required(),
        }).unknown().required(),
        previousState: cloudwatchAlarmStateSchema.required(),
        state: cloudwatchAlarmStateSchema.required(),
    }).unknown().required(),
    'detail-type': joi.string().valid('CloudWatch Alarm State Change').required(),
    source: joi.string().valid('aws.cloudwatch').required(),
}).unknown();

// schema of a single SNS event "record"
const snsEventRecordSchema = joi.object({
    EventSource: joi.string().valid('aws:sns').required(),
    Sns: joi.object({
        Message: joi.string().required(),
        Subject: joi.string().allow(null).required(),
        TopicArn: joi.string().required(),
        Type: joi.string().valid('Notification').required(),
    }).unknown(),
}).unknown().label('SNS event record');

// schema of an SNS event containing one or more "records"
const snsEventSchema = joi.object({
    Records: joi.array().items(snsEventRecordSchema).min(1).required(),
}).unknown();

/* functions */
// read an environment variable and log the status
const accessEnv = (key) => {
    const value = process.env[key];
    if (is.nullOrEmpty(value)) {
        console.warn(`WARNING: ${key} is not defined in the environment!`);
    } else {
        console.log(`Read "${key}" from the environment as "${value}".`);
    }
    return value;
};

// extract SNS message contents from an SNS event
const parseSnsMessage = (event) => {
    console.log('Parsing SNS message.');
    let message;
    let msgType;
    const rawMessage = event.Records[0].Sns.Message;
    try {
        message = JSON.parse(rawMessage);
        msgType = 'JSON';
    } catch (error) {
        message = rawMessage;
        msgType = 'a string';
    }
    console.log(`Parsed SNS message as ${msgType}.`, message);
    return message;
};

/* globals */
// name or contact info for the bot maintainer
Object.defineProperty(this, 'maintainer', {
    get: () => accessEnv('MAINTAINER'),
});

// return the log URI
Object.defineProperty(this, 'logUri', {
    get: () => {
        const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
        const logGroupName = encodeURIComponent(process.env.AWS_LAMBDA_LOG_GROUP_NAME);
        const logStreamName = encodeURIComponent(process.env.AWS_LAMBDA_LOG_STREAM_NAME);
        return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${logGroupName}/log-events/${logStreamName}`;
    },
});

// return the package name
Object.defineProperty(this, 'name', {
    get: () => pkg.name,
});

// return a configured SNS client
let _sns;
Object.defineProperty(this, 'sns', {
    get: () => {
        if (is.nullOrEmpty(_sns)) {
            const region = this.topicArn.split(':')[3];
            _sns = new SNSClient({ region });
        }
        return _sns;
    },
});

// return timezones of interest
let _tz;
Object.defineProperty(this, 'timezone', {
    get: () => {
        if (is.nullOrEmpty(_tz)) {
            const tz = accessEnv('TIMEZONE');
            if (is.nullOrEmpty(tz) || tz === '[]') {
                _tz = ['UTC'];
            } else {
                _tz = JSON.parse(tz);
            }
        }
        return _tz;
    },
});

// return SNS topic ARN
let _topicArn;
Object.defineProperty(this, 'topicArn', {
    get: () => {
        if (is.nullOrEmpty(_topicArn)) {
            _topicArn = accessEnv('AWS_SNS_TOPIC_ARN');
            if (is.nullOrEmpty(_topicArn)) {
                throw new Error('AWS_SNS_TOPIC_ARN is not defined in the environment!');
            }
        }
        return _topicArn;
    },
});

// return the git version of this build
Object.defineProperty(this, 'version', {
    get: () => ((is.nullOrEmpty(pkg.git.tag)) ? pkg.git.commit : pkg.git.tag),
});

/* sns */
// publish an SNS message
const pushSnsMsg = async (message, subject, topicArn = this.topicArn) => {
    console.log('Sending message to SNS...');
    const command = new PublishCommand({
        Message: message,
        Subject: subject,
        TopicArn: topicArn,
    });
    const response = await this.sns.send(command);
    console.log('SNS message sent.');
    return response;
};

/* entrypoint */
module.exports.handler = async (event) => {
    const result = {
        statusCode: 500,
        body: 'FATAL: Unknown error!',
    };
    try {
        result.body = await this.main(event);
        result.statusCode = 200;
    } catch (error) {
        result.body = error;
        console.error(`FATAL: ${error.message}`, error.toString());
    }
    return result;
};

// handle SNS event
module.exports.main = async (event) => {
    // validate event schema
    console.log('Received event:', JSON.stringify(event, null, 4));
    joi.assert(event, snsEventSchema, 'SNS event failed joi schema validation!');
    // parse and validate message contents
    const message = parseSnsMessage(event);
    joi.assert(message, cloudwatchEventSchema, 'SNS message failed joi schema validation!');
    // generate human-readable notification
    const notification = this.notificationFromCloudWatchEvent(message);
    const subject = `${this.maintainer} - ${message.detail.alarmName} ${message.detail.state.value}`;
    // send message to SNS topic
    const result = await pushSnsMsg(notification, subject);
    // sanitize, print, and return result
    console.log('Done.', result);
    return result;
};

// return a human-friendly notification body for a CloudWatch alarm state change event
module.exports.notificationFromCloudWatchEvent = (message) => {
    let emoji;
    let state;
    let tail;
    if (message.detail.state.value === 'ALARM') {
        emoji = '❌';
        state = 'triggered';
        tail = 'Please put eyes 👀 on this message if you are investigating this.';
    } else if (message.detail.state.value === 'OK') {
        emoji = '✅';
        state = 'resolved';
        tail = 'Yaaaaay! 🎉';
    } else {
        emoji = '❔';
        state = 'ambiguous';
        tail = `Contact ${this.maintainer} if this does not resolve in ten minutes or so.`;
    }
    const head = `${emoji} **${message.detail.alarmName}** ${emoji}`;
    const intro = `The \`${message.detail.alarmName}\` alarm is ${state}!`;
    const description = message.detail.configuration.description;
    const reason = `Reason:\n\`\`\`\n${message.detail.state.reason.replace(/ [(][^)]*[0-9]{2}\/[0-9]{2}\/[0-9]{2}[^)]*[)]/, '')}\n\`\`\``; // remove ambiguous timestamp(s) from reason string
    // print timestamp in timezones of interest
    const time = moment(message.detail.state.timestamp);
    let timestamp = 'Timestamp:\n```\n';
    for (let i = 0; i < this.timezone.length; i++) {
        timestamp += `${time.tz(this.timezone[i]).format('YYYY-MM-DD HH:mm:ss.SSS z')}\n`;
    }
    timestamp += '```';
    // construct and return message
    return `${head}\n${intro} ${description}\n\n${reason}\n${timestamp}\n${tail}`;
};

// return a human-friendly notification body from a nodeJS error
module.exports.notificationFromError = (error) => {
    const head = `❗ **${process.env.AWS_LAMBDA_FUNCTION_NAME}** ❗`;
    const gh = `[${this.name}:${pkg.git.tag || pkg.git.short_commit}](${pkg.homepage}/tree/${this.version})${(is.nullOrEmpty(pkg.git.tag)) ? ` from \`${pkg.git.branch}\`` : ''}`;
    const intro = `The \`${process.env.AWS_LAMBDA_FUNCTION_NAME}\` lambda running ${gh} just threw the following error:`;
    const stack = `\`\`\`\n${error.stack}\n\`\`\``;
    const logs = `>> [CloudWatch Logs](${this.logUri}) <<`;
    const tail = `Please contact ${this.maintainer} if you see this message.`;
    // join message parts
    return `${head}\n${intro}\n\n${stack}\n\n${logs}\n\n${tail}`;
};
