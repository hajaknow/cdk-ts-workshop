# Requirements

Note: You do not need to create a localstack account!

1. Docker installation
2. localstack CLI https://docs.localstack.cloud/aws/getting-started/installation/
3. npm
4. AWS CDK CLI for LocalStack https://docs.localstack.cloud/aws/integrations/aws-native-tools/aws-cdk/
5. AWS CLI
   - It is advisable to use the "default" aws cli profile, so make sure it's not connected to a real AWS account

# Getting started

Start localStack. Check that it is running:

```bash
curl http://localhost:4566/_localstack/health
```

# Create sample app

```bash
# init must be run in an empty directory
mkdir app
cd app
cdklocal init sample-app --language=typescript

# bootstrap the localstack environment
cdklocal bootstrap
```

Set account id and region of the Stack in app.ts

```typescript
new AppStack(app,
  'AppStack',
  {
    env: {
      account: "000000000000", // LocalStack account id
      region: "eu-north-1"  // Because Stockholm rocks!
    }
  }
);
```

```bash
# deploy the sample app
cdklocal deploy
```

Once the deployment is done, 
you can inspect the created resources using aws CLI.

Here's an alias for accessing localstack resources with aws cli

```bash
alias laws="aws --endpoint-url=http://localhost:4566 --region=eu-north-1"
# Test SNS Topic is created
laws sns list-topics
```

# Updates

Localstack sucks as updating stacks.

The only way is to destroy and redeploy the App. 

Here's an alias for doing just that without manual confirmations.

```bash
alias cdklocal-redeploy="cdklocal destroy --force && cdklocal deploy --require-approval never"
```

Idempotent deploys for the win, eh?


# Excercises

## Deploy sample lambda

https://docs.aws.amazon.com/lambda/latest/dg/lambda-cdk-tutorial.html

CDK spits out the API GW endpoint which calls the lambda function. Curl it! 

You can also see that the Lambda was created

```bash
# Test lamba and api-gw are created
laws lambda list-functions
laws apigateway get-rest-apis
```


## Refactor!

Place the Lambda and API GW Constructs into a class that extends Construct,
and place it in a new file.

## Refactor more!

Place the original SNS and Topic Constructs to a new file
in a class that extends Construct



## Deploy Item API

It is a Construct with Rest API (API GW) -> Lambda -> DynamoDB

The lambda ts code has some dependencies.   
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
