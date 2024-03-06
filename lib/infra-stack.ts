import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as sqs from "aws-cdk-lib/aws-sqs";

import * as path from "path";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const dlq = new sqs.Queue(this, "failed-logs-demo-queue");

    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:1`
    );

    const httpApi = new apigw.HttpApi(this, "APIGW", {
      apiName: "lambda-logs-demo"
    });

    const receiverFunction = new NodejsFunction(this, "receiver-function", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/receiver/main.ts"),
      handler: "startHandler",
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 256,
      bundling: {
        externalModules: [
          "aws-sdk",
          "@aws-lambda-powertools/commons",
          "@aws-lambda-powertools/logger",
          "@aws-lambda-powertools/metrics",
          "@aws-lambda-powertools/tracer", 
        ],
      },
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.ONE_DAY,
      deadLetterQueue: dlq,
      layers: [powertoolsLayer],
      environment: {
        POWERTOOLS_SERVICE_NAME: "lambda-logs-demo",
        POWERTOOLS_METRICS_NAMESPACE: "Example",
        POWERTOOLS_LOG_LEVEL: "INFO",
      }
    });

    const lambdaIntegration = new HttpLambdaIntegration("lambdaintegration", receiverFunction)

    httpApi.addRoutes({
      path: "/",
      methods: [apigw.HttpMethod.ANY],
      integration: lambdaIntegration
    });


    new cdk.CfnOutput(this, "apigw", {
      value: httpApi.apiEndpoint
    });

  }
}
