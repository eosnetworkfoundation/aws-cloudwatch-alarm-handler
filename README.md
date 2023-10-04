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

---
> **_Legal Notice_**  
Some content in this repository was generated in collaboration with one or more machine learning algorithms or weak artificial intelligence (AI). This notice is required in some countries.
