# AWS CloudWatch Alarm Handler
JavaScript Amazon Web Services (AWS) [Lambda](https://aws.amazon.com/lambda) function to take a [CloudWatch](https://aws.amazon.com/cloudwatch) alarm state change event, generate a human-readable notification body, and send it to an [SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) topic.

> [!IMPORTANT]
> Only tagged releases are considered "stable" software in this repo at this time.

### Index
1. [Development](#development)
    1. [Prerequisites](#prerequisites)
    1. [Initialization](#initialization)
    1. [Lint](#lint)
    1. [Test](#test)
    1. [Build](#build)
1. [CI](#ci)
1. [Inputs](#inputs)
    1. [Environment Variables](#environment-variables)
    1. [Events](#events)
1. [Outputs](#outputs)
    1. [Examples](#examples)

## Development
Start here to build this project or to contribute to this repo.

> [!NOTE]
> The source of truth for the version of nodeJS this project supports is the [`.nvmrc`](./.nvmrc) file. Backward- or forward-compatibility with other versions of `node` is made on a best-effort basis, but is not guaranteed.

### Prerequisites
You will need the following tools:
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [nodeJS](https://www.w3schools.com/nodejs/nodejs_intro.asp)  
    Install `node` using `nvm`. In the root of this repo:
    ```bash
    nvm install
    ```
    This will automagically install and use the correct version of `node` for this project, as defined in the [`.nvmrc`](./.nvmrc) file.
- [yarn](https://yarnpkg.com) version 1  
    The easiest way to install this is using `npm`, which is installed with `node` by `nvm`.
    ```bash
    npm install --global yarn
    ```
These tools are all you need to get started!

### Initialization
Once you have the [prerequisites](#prerequisites) installed, you can get going by making sure `nvm` is using the correct version of nodeJS...
```bash
nvm install
```
...and then downloading all project dependencies.
```bash
yarn
```
Easy.

### Lint
This project uses [eslint](https://eslint.org) with customizations on top of the [airbnb-base](https://www.npmjs.com/package/eslint-config-airbnb-base) config to perform static code analysis.
```bash
yarn lint
```
The purpose of linting is to catch bugs early, not to create unnecessary friction, so many rules which will not realistically catch bugs are disabled.

### Test
This project uses the [jest](https://jestjs.io) test framework.
```bash
yarn test
```
The goal is full test coverage, not because we chased a number, but because we exhaustively tested all intended functionality.

### Build
This is how release artifacts are generated.
```bash
yarn build
```
The "build" generates a `*.zip` archive in the root of the repo that can be uploaded directly to AWS Lambda using the web console, AWS CLI, or with something like ~~Terraform~~ Tofu.

The output of `yarn pack` is **_not_** compatible with AWS. AWS requires the dependencies (`node_modules`) to be packed in the `*.zip` file for lambdas, so it may be wise to do your own build with updated dependencies to make sure your deployment is not missing any security patches published for dependencies since our latest release. If you are building a tag, the script requires the version in the `git` tag to match the version in the `package.json`. Finally, the build script does briefly move your `node_modules` folder in order to guarantee developer dependencies are not packed into the `*.zip` file so it is as small as possible. The script puts your `node_modules` back afterwards so this should hopefully not be a problem for anyone.

## CI
This repo contains the following GitHub Actions workflow for continuous integration (CI):
- **AWS CloudWatch Alarm Handler CI** - lint, test, and build the `aws-cloudwatch-alarm-handler` project.
    - [Pipeline](https://github.com/eosnetworkfoundation/aws-cloudwatch-alarm-handler/actions/workflows/ci.yml)
    - [Documentation](./.github/workflows/ci.md)

See the pipeline documentation for more information.

## Inputs
This lambda receives two primary inputs:
1. User-defined environment variables to configure lambda behavior.
1. AWS Simple Notification Service (SNS) event payloads delivered by AWS, where the `Message` field contains a valid CloudWatch alarm state change event as "stringified" JSON.

Special attention should be paid to your lambda function name(s), alarm name(s), and alarm description(s). The resource name is the only real identifier sent to the maintainer or the customer to determine where an error message is coming from, and the alarm description is included verbatim in the message body. Your resource names need to be unique enough to globally identify these resources, especially if you have multiple AWS accounts. The alarm description should be something useful. For example, to copy the AWS example below, "This alarm triggers when the US datacenter API server CPU utilization is above 50% for five minutes."

### Environment Variables
This lambda is configured entirely with environment variables to make deployment in AWS easy.

Key | Usage | Type | Description
--- | --- | --- | ---
`AWS_DEFAULT_REGION` | [Intrinsic](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime) | String | Used to link maintainer to CloudWatch logs on error.
`AWS_LAMBDA_FUNCTION_NAME` | [Intrinsic](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime) | String | The name of the lambda function, used when sending error notifications.
`AWS_LAMBDA_LOG_GROUP_NAME` | [Intrinsic](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime) | String | Used to link maintainer to CloudWatch logs on error.
`AWS_LAMBDA_LOG_STREAM_NAME` | [Intrinsic](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime) | String | Used to link maintainer to CloudWatch logs on error.
`AWS_REGION` | [Intrinsic](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime) | String | Used to link maintainer to CloudWatch logs on error.
`AWS_SNS_TOPIC_ARN` | Required | String | SNS topic ARN for delivery of CloudWatch alarm notifications.
`AWS_SNS_TOPIC_ARN_ERROR` | Required | String | SNS topic ARN for delivery of runtime errors.
`CALL_TO_ACTION_ALARM` | Optional | String | A "call to action" string printed at the end of alarm notifications.
`MAINTAINER` | Required | String | Name of the bot maintainer or team.
`TIMEZONE` | Optional | JSON string array | List of timezone names and/or abbreviations accepted by [moment-timezone](https://momentjs.com/timezone/docs) in which to print event timestamps.

### Events
This lambda currently only supports SNS events as input. Event schema is validated using [joi](https://joi.dev). EventBridge events or inputs from other sources will throw a `ValidationError` exception.

The SNS event schema looks like this.
```json
{
  "Records": [
    {
      "EventSource": "aws:sns",
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:us-east-1:123456789012:sns-topic-name-goes-here:d9a4b8f1-36e7-4702-9e5d-2f1c871496ab",
      "Sns": {
        "Type": "Notification",
        "MessageId": "f3a8c7e9-241b-4d61-9e0c-86d4b2f8c730",
        "TopicArn": "arn:aws:sns:us-east-1:123456789012:sns-topic-name-goes-here",
        "Subject": null,
        "Message": "{\"version\":\"0\",\"id\":\"c4c1c1c9-6542-e61b-6ef0-8c4d36933a92\",\"detail-type\":\"CloudWatch Alarm State Change\",\"source\":\"aws.cloudwatch\",\"account\":\"123456789012\",\"time\":\"2019-10-02T17:04:40Z\",\"region\":\"us-east-1\",\"resources\":[\"arn:aws:cloudwatch:us-east-1:123456789012:alarm:ServerCpuTooHigh\"],\"detail\":{\"alarmName\":\"ServerCpuTooHigh\",\"configuration\":{\"description\":\"Goes into alarm when server CPU utilization is too high!\",\"metrics\":[{\"id\":\"30b6c6b2-a864-43a2-4877-c09a1afc3b87\",\"metricStat\":{\"metric\":{\"dimensions\":{\"InstanceId\":\"i-12345678901234567\"},\"name\":\"CPUUtilization\",\"namespace\":\"AWS/EC2\"},\"period\":300,\"stat\":\"Average\"},\"returnData\":true}]},\"previousState\":{\"reason\":\"Threshold Crossed: 1 out of the last 1 datapoints [0.0666851903306472 (01/10/19 13:46:00)] was not greater than the threshold (50.0) (minimum 1 datapoint for ALARM -> OK transition).\",\"reasonData\":\"{\\\"version\\\":\\\"1.0\\\",\\\"queryDate\\\":\\\"2019-10-01T13:56:40.985+0000\\\",\\\"startDate\\\":\\\"2019-10-01T13:46:00.000+0000\\\",\\\"statistic\\\":\\\"Average\\\",\\\"period\\\":300,\\\"recentDatapoints\\\":[0.0666851903306472],\\\"threshold\\\":50.0}\",\"timestamp\":\"2019-10-01T13:56:40.987+0000\",\"value\":\"OK\"},\"state\":{\"reason\":\"Threshold Crossed: 1 out of the last 1 datapoints [99.50160229693434 (02/10/19 16:59:00)] was greater than the threshold (50.0) (minimum 1 datapoint for OK -> ALARM transition).\",\"reasonData\":\"{\\\"version\\\":\\\"1.0\\\",\\\"queryDate\\\":\\\"2019-10-02T17:04:40.985+0000\\\",\\\"startDate\\\":\\\"2019-10-02T16:59:00.000+0000\\\",\\\"statistic\\\":\\\"Average\\\",\\\"period\\\":300,\\\"recentDatapoints\\\":[99.50160229693434],\\\"threshold\\\":50.0}\",\"timestamp\":\"2019-10-02T17:04:40.989+0000\",\"value\":\"ALARM\"}}}",
        "Timestamp": "2023-09-26T00:31:17.412Z",
        "SignatureVersion": "1",
        "Signature": "VG9nZXJtZW50UGxhY2Vob2xkZXIxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMA==",
        "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-s8f4a1b7c0e9d3a4e5e2b3d6a9c7b0f1.pem",
        "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:123456789012:sns-topic-name-goes-here:d9a4b8f1-36e7-4702-9e5d-2f1c871496ab",
        "MessageAttributes": {}
      }
    }
  ]
}
```
The SNS event contains a `message` payload from CloudWatch that looks like this when unpacked.
```json
{
  "version": "0",
  "id": "c4c1c1c9-6542-e61b-6ef0-8c4d36933a92",
  "detail-type": "CloudWatch Alarm State Change",
  "source": "aws.cloudwatch",
  "account": "123456789012",
  "time": "2019-10-02T17:04:40Z",
  "region": "us-east-1",
  "resources": ["arn:aws:cloudwatch:us-east-1:123456789012:alarm:ServerCpuTooHigh"],
  "detail": {
    "alarmName": "ServerCpuTooHigh",
    "configuration": {
      "description": "Goes into alarm when server CPU utilization is too high!",
      "metrics": [{
        "id": "30b6c6b2-a864-43a2-4877-c09a1afc3b87",
        "metricStat": {
          "metric": {
            "dimensions": {
              "InstanceId": "i-12345678901234567"
            },
            "name": "CPUUtilization",
            "namespace": "AWS/EC2"
          },
          "period": 300,
          "stat": "Average"
        },
        "returnData": true
      }]
    },
    "previousState": {
      "reason": "Threshold Crossed: 1 out of the last 1 datapoints [0.0666851903306472 (01/10/19 13:46:00)] was not greater than the threshold (50.0) (minimum 1 datapoint for ALARM -> OK transition).",
      "reasonData": "{\"version\":\"1.0\",\"queryDate\":\"2019-10-01T13:56:40.985+0000\",\"startDate\":\"2019-10-01T13:46:00.000+0000\",\"statistic\":\"Average\",\"period\":300,\"recentDatapoints\":[0.0666851903306472],\"threshold\":50.0}",
      "timestamp": "2019-10-01T13:56:40.987+0000",
      "value": "OK"
    },
    "state": {
      "reason": "Threshold Crossed: 1 out of the last 1 datapoints [99.50160229693434 (02/10/19 16:59:00)] was greater than the threshold (50.0) (minimum 1 datapoint for OK -> ALARM transition).",
      "reasonData": "{\"version\":\"1.0\",\"queryDate\":\"2019-10-02T17:04:40.985+0000\",\"startDate\":\"2019-10-02T16:59:00.000+0000\",\"statistic\":\"Average\",\"period\":300,\"recentDatapoints\":[99.50160229693434],\"threshold\":50.0}",
      "timestamp": "2019-10-02T17:04:40.989+0000",
      "value": "ALARM"
    }
  }
}
```
The schema of this CloudWatch "alarm state change" message is also validated using `joi`.

The `reasonData` field looks like this when parsed and expanded.
```json
{
  "reasonData": {
    "version": "1.0",
    "queryDate": "2019-10-02T17:04:40.985+0000",
    "startDate": "2019-10-02T16:59:00.000+0000",
    "statistic": "Average",
    "period": 300,
    "recentDatapoints": [
      99.50160229693434
    ],
    "threshold": 50
  }
}
```
The `reasonData` field is not being parsed or validated because we currently do not use it. Code to unpack the `reasonData` field is [here](https://github.com/eosnetworkfoundation/aws-cloudwatch-alarm-handler/blob/3097e31d525d852bfffcf098a7750455bd28c176/index.js#L65) if you ever need it.

## Outputs
This lambda has four primary outputs:
1. An SNS message published to an SNS topic containing:
    - **message** - a string containing a human-readable alarm notification.
    - **subject** - a string for the email subject, if you have email subscribers.
1. Logs in CloudWatch.
1. Return value, a JSON object with this schema:
    - **body** - response from SNS publish command.
    - **statusCode** - HTTP response for the lambda as a whole.

### Examples
Here are some sample notifications.

#### ALARM
Raw:
```json
"❌ **acmecorp-us-east_server-cpu-too-high** ❌\nThe `acmecorp-us-east_server-cpu-too-high` alarm is triggered! This alarm triggers when CPU utilization of the `acmecorp-us-east` server exceeds 50% for five minutes.\n\nReason:\n```\nThreshold Crossed: 1 out of the last 1 datapoints [99.50160229693434] was greater than the threshold (50.0) (minimum 1 datapoint for OK -> ALARM transition).\n```\nTimestamp:\n```\n2019-02-10 16:59:00.412 EDT\n```\nPlease put eyes 👀 on this message if you are investigating this."
```
Rendered:
> ❌ **acmecorp-us-east_server-cpu-too-high** ❌
> The `acmecorp-us-east_server-cpu-too-high` alarm is triggered! This alarm triggers when CPU utilization of the `acmecorp-us-east` server exceeds 50% for five minutes.
>
> Reason:
> ```
> Threshold Crossed: 1 out of the last 1 datapoints [99.50160229693434] was greater than the threshold (50.0) (minimum 1 datapoint for OK -> ALARM transition).
> ```
> Timestamp:
> ```
> 2019-02-10 16:59:00.412 EDT
> ```
> Please put eyes 👀 on this message if you are investigating this.

#### INSUFFICIENT_DATA
Raw:
```json
"❔ **acmecorp-us-east_server-cpu-too-high** ❔\nThe `acmecorp-us-east_server-cpu-too-high` alarm is ambiguous! This alarm triggers when CPU utilization of the `acmecorp-us-east` server exceeds 50% for five minutes.\n\nReason:\n```\nUnchecked: Initial alarm creation\n```\nTimestamp:\n```\n2019-02-10 13:43:12.896 EDT\n```\nContact the bot maintainer if this does not resolve in ten minutes or so."
```
Rendered:
> ❔ **acmecorp-us-east_server-cpu-too-high** ❔
> The `acmecorp-us-east_server-cpu-too-high` alarm is ambiguous! This alarm triggers when CPU utilization of the `acmecorp-us-east` server exceeds 50% for five minutes.
>
> Reason:
> ```
> Unchecked: Initial alarm creation
> ```
> Timestamp:
> ```
> 2019-02-10 13:43:12.896 EDT
> ```
> Contact the bot maintainer if this does not resolve in ten minutes or so.

#### OK
Raw:
```json
"✅ **acmecorp-us-east_server-cpu-too-high** ✅\nThe `acmecorp-us-east_server-cpu-too-high` alarm is resolved! This alarm triggers when CPU utilization of the `acmecorp-us-east` server exceeds 50% for five minutes.\n\nReason:\n```\nThreshold Crossed: 1 out of the last 1 datapoints [01.60229693434] was lower than or equal to the threshold (50.0) (minimum 1 datapoint for ALARM -> OK transition).\n```\nTimestamp:\n```\n2019-02-10 17:04:00.421 EDT\n```\nYaaaaay! 🎉"
```
Rendered:
> ✅ **acmecorp-us-east_server-cpu-too-high** ✅
> The `acmecorp-us-east_server-cpu-too-high` alarm is resolved! This alarm triggers when CPU utilization of the `acmecorp-us-east` server exceeds 50% for five minutes.
>
> Reason:
> ```
> Threshold Crossed: 1 out of the last 1 datapoints [01.60229693434] was lower than or equal to the threshold (50.0) (minimum 1 datapoint for ALARM -> OK transition).
> ```
> Timestamp:
> ```
> 2019-02-10 17:04:00.421 EDT
> ```
> Yaaaaay! 🎉

---
> **_Legal Notice_**  
Some content in this repository was generated in collaboration with one or more machine learning algorithms or weak artificial intelligence (AI). This notice is required in some countries.
