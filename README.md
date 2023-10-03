# AWS CloudWatch Alarm Handler
JavaScript Amazon Web Services (AWS) [Lambda](https://aws.amazon.com/lambda) function to take a [CloudWatch](https://aws.amazon.com/cloudwatch) alarm state change event, generate a human-readable notification body, and send it to an [SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) topic.

> [!IMPORTANT]
> Only tagged releases are considered "stable" software in this repo at this time.

### Index
1. [Development](#development)
    1. [Prerequisites](#prerequisites)
    1. [Initialization](#initialization)

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

---
> **_Legal Notice_**  
Some content in this repository was generated in collaboration with one or more machine learning algorithms or weak artificial intelligence (AI). This notice is required in some countries.
