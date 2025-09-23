# CDK with Typescript

## Requirements

Note: You do not need to create a localstack account!

1. Docker installation
2. npm
3. AWS CDK CLI for LocalStack https://docs.localstack.cloud/aws/integrations/aws-native-tools/aws-cdk/
   * `npm install -g aws-cdk-local aws-cdk`
   * `cdklocal --version`
   * `aws --version`
4. AWS CLI
   - It is advisable to use the "default" aws cli profile, so make sure it's not connected to a real AWS account

## Getting started

Configure a default profile for AWS CLI:
```
aws configure
AWS Access Key ID [None]: id
AWS Secret Access Key [None]: access-key
Default region name [eu-north-1]:
Default output format [json]:
```

Access Key Id and Secret Access Key do not matter when working with Localstack. The values for these can be whatever.
You can set `eu-north-1` as the default region and choose `json` as the default output format.

Start the Localstack from the root folder in a container:
```bash
docker compose up
```

Check that it is running:
```bash
curl http://localhost:4566/_localstack/health
```

Navigate to `app` directory and install npm packages:
```bash
cd app
npm install
```

### Bootstrap the CDK environment

[Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) prepares your AWS environment by 
provisioning specific AWS resources in your environment that are used by the AWS CDK. These resources are commonly 
referred to as your bootstrap resources. They include the following:

- Amazon Simple Storage Service (Amazon S3) bucket – Used to store your CDK project files, such as AWS Lambda function code and assets.
- Amazon Elastic Container Registry (Amazon ECR) repository – Used primarily to store Docker images.
- AWS Identity and Access Management (IAM) roles – Configured to grant permissions needed by the AWS CDK to perform deployments.

In app dir, run: 
```bash
# AWS accountId and region are prefilled from the parameters of `AppStack`
cdklocal bootstrap 
```
>SIDENOTE: This command receives AWS account id and region from the parameters of `AppStack`
This command could be done from any directory by specifying them explicitly (`cdklocal bootstrap <000000000000/eu-north-1>`)

### Deploy

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

## Updates

Localstack sucks at updating stacks.

The only way is to destroy and redeploy the App. 

Here's an alias for doing just that without manual confirmations:
```bash
alias cdklocal-redeploy="cdklocal destroy --force && cdklocal deploy --require-approval never"
```

Alternatively you can run the following npm script:
```bash
npm run cdklocal-redeploy
```

Idempotent deploys for the win, eh?

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

### EXERCISE X: Deploy Item API

It is a Construct with Rest API (API GW) -> Lambda -> DynamoDB

Uncomment it in `app.ts`

The lambda handler TS code has some dependencies.   
Run `npm install` in `app/lib/constructs/item-api/lambda-handler` 
to install them.

```bash
# Test requests:

# 201 
curl -v --header "Content-Type: application/json" \
  --request POST \
  --data '{"itemId":"helloWorld"}' [ItemsApi_URL]/items
  
# "invalid request, you are missing the parameter body" (400)
curl --header "Content-Type: application/json" \                                                <aws:default>
  --request POST  https://ehe62gcivd.execute-api.localhost.localstack.cloud:4566/prod/items
  
# Test dynamoDB has items:
laws dynamodb scan --table-name items
```

## After the exercises

### Clean up global npm installations

`npm uninstall -g aws-cdk-local aws-cdk`
