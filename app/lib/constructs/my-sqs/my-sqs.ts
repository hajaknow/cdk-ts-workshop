import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';


export class MySQS extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    const queue = new sqs.Queue(this, 'AppQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'AppTopic');
    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
