# CDK workshop with Typescript (against LocalStack)

## Requirements

> NOTE: You do not need to create any accounts for LocalStack or AWS 
> no matter what they say on the website!

1. Docker installation
2. npm
3. AWS CDK CLI for LocalStack: https://docs.localstack.cloud/aws/integrations/aws-native-tools/aws-cdk/
    * `npm install -g aws-cdk-local aws-cdk`
    * `cdklocal --version`
4. AWS CLI https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
    * `aws --version`

## Getting started

It is advisable to use the "default" AWS CLI profile, make sure it's not connected to a real AWS account! 

Let's configure the default profile for AWS CLI:

```bash
aws configure
AWS Access Key ID [None]: id
AWS Secret Access Key [None]: access-key
Default region name [eu-north-1]:
Default output format [json]:
```

Access Key Id and Secret Access Key do not matter when working with LocalStack.
The values for these can be whatever. We can set `eu-north-1` as the default region
and choose `json` as the default output format.

Start the LocalStack from the root folder in a container:

```bash
docker compose up
```

Check that it is running:

```bash
curl http://localhost:4566/_localstack/health
```

## Exercise 0: Create the initial CDK Sample App

Create an empty `app` directory, navigate to it, and run the following command

```bash
cdklocal init sample-app --language=typescript
```

## Excercise 0.5: Exploring the Sample App

Looking at the code in `lib/app-stack.ts`, the sample app seems to only create three AWS resources:

1. An SQS Queue (SQS = Simple Queue Service)
2. An SNS Topic (SNS = Simple Notification Service) 
3. The SQS Queue then becomes a Subscriber to the Topic

So that's Queue + Topic + Subscription = 3 resources, right? 
   
Almost! Additionally the Topic gets the necessary write access to the Queue. 
We don't see it here, because necessary resources are created for us behind the scenes!

Let's see what the actual CloudFormation template looks like to see everything that
CDK has created for us.

```bash
cdklocal synth
```

This will output a lovely CloudFormation YAML to your tiny terminal.

> NOTE:   
> If you hate YAML and love JSON, you can use the `--json` flag. 

After you've synthesized the template, 
you can always find the JSON version of it in `/cdk.out/AppStack.template.json`.

Let's look at the `Resources` section in the CDK Template, focusing on the `Type` of each resource.

We can identify four resources in total:

1. `AWS::SQS::Queue`
2. `AWS::SQS::QueuePolicy` (Adds permissions for the Topic to write to the SQS Queue)
3. `AWS::SNS::Subscription`
4. `AWS::SNS::Topic`

We don't need to bother ourselves with the `CDKMetadata` and `Parameters` sections of the template right now, 
and we don't yet have anything in the `Outputs` section, but it's good to be aware that they also exist in 
the CloudFormation template.

Ultimately, this template is the recipe that we hand off to AWS so it knows which resources it needs to create.  


## Exercise 1: Bootstrap the CDK environment

Quoting AWS:

> [Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) prepares your AWS environment by
> provisioning specific AWS resources in your environment that are used by the AWS CDK.  
> These resources are commonly referred to as your bootstrap resources. They include the following:
>
> - Amazon Simple Storage Service (Amazon S3) bucket – Used to store your CDK project files, such as AWS Lambda function
    code and assets.
> - Amazon Elastic Container Registry (Amazon ECR) repository – Used primarily to store Docker images.
> - AWS Identity and Access Management (IAM) roles – Configured to grant permissions needed by the AWS CDK to perform
    deployments.

Before bootstrapping, we should define our accountId and region for the stack in our sample app.

Replace the contents of `bin/app.ts` with the following:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();
new AppStack(app, 'AppStack', {
  env: {
    account: '000000000000', // Default LocalStack accountId
    region: 'eu-north-1',    // Stockholm rules !!
  }
});
```

In app dir, run:

```bash
# AWS accountId and region are prefilled from the parameters of `AppStack`
cdklocal bootstrap 
```

> **SIDENOTE**
>   
> This command receives AWS account id and region from the parameters of `AppStack`  
> The command could be done from any directory by specifying the parameters explicitly:  
> `cdklocal bootstrap 000000000000/eu-north-1`

## Exercise 2: First Deploy

Deploy the sample app:

```bash
cdklocal deploy
```

Once the deployment is done,
we can inspect the created resources using AWS CLI.

Because of LocalStack, we have to append a lengthy `--endpoint-url` flag to our command

```bash
# Check that an SNS Topic was created
aws --endpoint-url=http://localhost:4566 --region=eu-north-1 sns list-topics
```

Because this is long and annoying, let's create a some npm scripts to help us with the AWS CLI commands. 
(Plus a few extras that we will need later!)

Replace the "scripts" section in `package.json` with these:

```
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "build-test": "tsc && jest",
    "cdk": "cdk",
    "cdklocal-redeploy": "cdklocal destroy --force && cdklocal deploy --require-approval never",
    "aws-sns-list-topics": "aws --endpoint-url=http://localhost:4566 --region=eu-north-1 sns list-topics",
    "aws-lambda-list-functions": "aws --endpoint-url=http://localhost:4566 --region=eu-north-1 lambda list-functions",
    "aws-apigateway-get-rest-apis": "aws --endpoint-url=http://localhost:4566 --region=eu-north-1 apigateway get-rest-apis",
    "aws-dynamodb-scan-table-items": "aws --endpoint-url=http://localhost:4566 --region=eu-north-1 dynamodb scan --table-name items"
  }
```

Now we can simply run this command to get the same result:

```bash
npm run aws-sns-list-topics
```

## Exercise 3: Run tests

CDK init has created a sample test for us in `/tests/app.test.ts`

The test executes our CDK code, and then synthesises a CloudFormation template (AWS-native IaC) of the Stack.

The assertions are done against this template which actually defines what resources deployed to AWS.

The sample test checks that there is a `AWS::SQS::Queue` resource with a `VisibilityTimeout: 300` property.

It also checks that exactly one `AWS::SNS::Topic` resource has been made.

Run tests with
```bash
npm run test
```

## Exercise 4: Modify AppStack

Let's modify the resources of `lib/app-stack.ts` a bit. 

Create a second Topic with id = `AppTopic2`, and add `AppQueue` as its only Subscriber.

Run tests, see that it fails, then fix the tests!

## Exercise 5: "Update" AppStack (Not in this workshop though)

If we would be working against a real AWS environment the sample AppStack could simply be deployed again,
and everything should work fine.

Unfortunately for us, LocalStack really sucks at updating stacks.

With LocalStack, the only way is to destroy and redeploy our Stack, or the entire App, as we are about to do here!

Idempotent deploys for the win, eh?

For this we have the npm script `cdklocal-redeploy`, 
which executes the following two commands:
```bash
# Use `npm run cdklocal-redeploy` instead of
cdklocal destroy --force && cdklocal deploy --require-approval never
```

The `--force` and `--require-approval never` liberate use from the arduous task of manual confirmation.

We can now run the script: 

```bash
npm run cdklocal-redeploy
```

Check that now we have two SNS topics

```bash
npm run aws-sns-list-topics
```

### Excercise 6: Deploy a HelloLambda function

[AWS Lambda functions](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) are great, let's deploy one!

Add the following lines of code inside the AppStack constructor `lib/app-stack.ts`. 

It can be, for example underneath the existing SNS resource code.

```typescript
// previous imports ...

// add these imports!
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from 'node:path';


export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ... AppQueue and AppTopic resources ...
    
    const fn = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler')),
    });
    
    const endpoint = new apigw.LambdaRestApi(this, `ApiGwEndpoint`, {
      handler: fn,
      restApiName: `HelloApi`,
    });
  }
}
```

Lambda functions support TypeScript, but in this example we will use JavaScript.

Create a new folder `/lib/lambda-handler` and create a new file named `index.js` there with the following content:

```javascript
exports.handler = async (event) => {
  // Extract specific properties from the event object
  const { resource, path, httpMethod, headers, queryStringParameters, body } = event;
  const response = {
    resource,
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body: body || 'Hello world!!!',
  };
  return {
    body: JSON.stringify(response, null, 2),
    statusCode: 200,
  };
};

```

Time to redeploy!

```bash
npm run cdklocal-redeploy
```

CDK gives an API GW endpoint URL as an Output. 
This endpoint calls the lambda function and returns its result. 

```bash
# Example output
Outputs:
AppStack.ApiGwEndpoint77F417B1 = https://r72pyu2yff.execute-api.localhost.localstack.cloud:4566/prod/
```

Curl the endpoint URL!

```bash
curl https://r72pyu2yff.execute-api.localhost.localstack.cloud:4566/prod/
{
  "resource": "/",
  "path": "/",
  "httpMethod": "GET",
  ...
  "body": "Hello world!!!"
}
```

Check that the Lambda was created.

```bash
npm run aws-lambda-list-functions
npm run aws-apigateway-get-rest-apis 
```

If you're interested, go check out what AWS CLI commands these npm scripts send! 

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

Before running the test requests, find our Api Gateway id with `npm run aws-apigateway-get-rest-apis`
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
npm run aws-dynamodb-scan-table-items
```

## EXERCISE Y: Dev and Prod Stages

The [CDK Stage](https://docs.aws.amazon.com/cdk/v2/guide/stages.html) represents a group of one or more CDK stacks
that are configured to deploy together. Use stages to deploy the same grouping of stacks to multiple environments,
such as development, testing, and production.

0. Destroy the currently deployed stack with `cdklocal destroy --force`
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

Bootstrap the account again. Both regions will be bootstrapped separately!

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
