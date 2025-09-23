import * as cdk from 'aws-cdk-lib';
import { Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppStack } from "../stacks/app-stack";


export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new AppStack(this, 'AppStack');
  }
}
