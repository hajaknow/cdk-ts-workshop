# CDK with Typescript

## Requirements

Note: You do not need to create a localstack account!

1. Docker installation
2. npm
3. AWS CDK CLI for LocalStack: https://docs.localstack.cloud/aws/integrations/aws-native-tools/aws-cdk/

* `npm install -g aws-cdk-local aws-cdk`
* `cdklocal --version`


4. AWS CLI

* `aws --version`
* It is advisable to use the "default" aws cli profile, make sure it's not connected to a real AWS account!

## Getting started

Configure a default profile for AWS CLI:

```
aws configure
AWS Access Key ID [None]: id
AWS Secret Access Key [None]: access-key
Default region name [eu-north-1]:
Default output format [json]:
```

Access Key Id and Secret Access Key do not matter when working with Localstack.
The values for these can be whatever. You can set `eu-north-1` as the default region
and choose `json` as the default output format.

Start the Localstack from the root folder in a container:

```bash
docker compose up
```

Check that it is running:

```bash
curl http://localhost:4566/_localstack/health
```

### Exercise 0: Create the initial CDK app

Create an empty `app` directory, navigate to it, and run the following command

```bash
cdklocal init sample-app --language=typescript
```

Then install npm packages:

```bash
npm install
```

### Exercise N: Bootstrap the CDK environment

[Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) prepares your AWS environment by
provisioning specific AWS resources in your environment that are used by the AWS CDK.  
These resources are commonly referred to as your bootstrap resources. They include the following:

- Amazon Simple Storage Service (Amazon S3) bucket – Used to store your CDK project files, such as AWS Lambda function
  code and assets.
- Amazon Elastic Container Registry (Amazon ECR) repository – Used primarily to store Docker images.
- AWS Identity and Access Management (IAM) roles – Configured to grant permissions needed by the AWS CDK to perform
  deployments.

In app dir, run:

```bash
# AWS accountId and region are prefilled from the parameters of `AppStack`
cdklocal bootstrap 
```

> SIDENOTE:  
> This command receives AWS account id and region from the parameters of `AppStack`  
> The command could be done from any directory by specifying the parameters explicitly:  
> `cdklocal bootstrap 000000000000/eu-north-1`

### Exercise N: Deploy

Deploy the sample app:

```bash
cdklocal deploy
```

Once the deployment is done,
you can inspect the created resources using aws CLI.

Here's an alias for accessing localstack resources with aws cli:

```bash
alias laws="aws --endpoint-url=http://localhost:4566 --region=eu-north-1"
# Test SNS Topic is created
laws sns list-topics
```

Alternatively you can run the following npm script:

```bash
npm run check-sns
```

## Exercise N: "Update" (Not in this workshop though)

If you now simply edited the sample AppStack and deployed again to a real AWS environment,
everything should work fine.

Unfortunately for us, Localstack really sucks at updating stacks.

The only way is to destroy and redeploy Stacks, or the entire App, as we are about to do here!

Idempotent deploys for the win, eh?

Here's an alias for doing just that without manual confirmations:

```bash
alias cdklocal-redeploy="cdklocal destroy --force && cdklocal deploy --require-approval never"
```

Alternatively you can run the following npm script:

```bash
npm run cdklocal-redeploy
```

## Exercises

### Deploy sample lambda

https://docs.aws.amazon.com/lambda/latest/dg/lambda-cdk-tutorial.html

CDK spits out the API GW endpoint which calls the lambda function. Curl it!

You can also see that the Lambda was created:

```bash
# Test lamba and api-gw are created
laws lambda list-functions
laws apigateway get-rest-apis
```

Alternatively run

```bash
npm run check-lambda
npm run check-apigw
```

### Refactor!

Place the Lambda and API GW Constructs into class HelloLambda that extends Construct,
and place it in the following file: `lib/constructs/hello-lambda/hello-lambda.ts`

Place the lambda handler code in `lib/constructs/hello-lambda/lambda-handler/index.js`

### Refactor more!

Place the original SNS and Topic into class MySQS that extends Construct
and into the file `lib/constructs/my-sqs/my-sqs.ts`

### Write tests

### EXERCISE X: Deploy Item API

Copy `item-api.ts` from X ?????????

It is a Construct with Rest API (API GW) -> Lambda -> DynamoDB

Uncomment it in `app.ts`

Before running the test requests, find your Api Gateway id with `npm run check-apigw`
and replace the `<ApiGWId>` in the test requests

```bash
# Test requests:

# 201 and returns itemId (UUID)
curl -v --header "Content-Type: application/json" \
  --request POST \
  --data '{"itemId":"helloWorld"}' https://<ApiGWId>.execute-api.localhost.localstack.cloud:4566/prod/items
  
# copy the returned itemId (UUID)
  
# 200 and returns item as json
curl -v https://<ApiGWId>.execute-api.localhost.localstack.cloud:4566/prod/items/itemId
  

# "invalid request, you are missing the parameter body" (400)
curl --header "Content-Type: application/json" \                   
  --request POST  https://<ApiGWId>.execute-api.localhost.localstack.cloud:4566/prod/items
  
# Test dynamoDB has items:
laws dynamodb scan --table-name items
# OR
npm run dynamodb-scan-items
```

## EXERCISE Y: Dev and Prod Stages

The [CDK Stage](https://docs.aws.amazon.com/cdk/v2/guide/stages.html) represents a group of one or more CDK stacks
that are configured to deploy together. Use stages to deploy the same grouping of stacks to multiple environments,
such as development, testing, and production.

0. Destroy your current stack `cdklocal destroy --force`
1. Create the class AppStage (that extends cdk.Stage) into a new file: `lib/stages/AppStage.ts`
2. In the Stage constructor, create AppStack with the same logical id `AppStack`.
3. Next let's create two stages: `Dev` and `Prod`!

Replace the contents of `bin/app.ts` with the following code:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppStage } from "../lib/stages/AppStage";

const app = new cdk.App();

new AppStage(app, 'Dev', {
  env: {
    account: "000000000000",
    region: "eu-north-1" // Stockholm region
  }
})

new AppStage(app, 'Prod', {
  env: {
    // Normally, prod account would be different from dev account
    // However, localStack makes cross-account work difficult for us
    account: "000000000000",
    // Instead, let's change the region! À Paris, bien sûr!
    region: "eu-west-3" // Paris region
  }
});
```

Bootstrap your account again:

```bash
cdk bootstrap
```

Deploy all stacks for both Dev and Prod Stages.

```bash
cdklocal deploy --require-approval=never "Dev/*" "Prod/*"
# "Stage/*" here means just AppStack, though, so this would be equivalent and more explicit:
# cdklocal deploy --require-approval=never "Dev/AppStack" "Prod/AppStack"
```

Verify that both Dev and Prod environments work by calling each of their ItemsApi POST and GET(-by-id) lambdas.

To access Prod by AWS CLI use the `--endpoint-url` and `--region` flags

```bash
# For example, to scan Prod dynamodb table "items"
aws --endpoint-url=http://localhost:4566 --region=eu-west-3 dynamodb scan --table-name items
```

# After the exercises

### Clean up global npm installations

`npm uninstall -g aws-cdk-local aws-cdk`
