import {
    Handler,
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
  } from "aws-lambda";

import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger();

type ProxyHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;

export const startHandler: ProxyHandler = async (event, context) => {
    logger.debug(`Event: ${JSON.stringify(event, null, 2)}`);
    logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);    
    logger.info(`Received Message: ${JSON.stringify(event.body)}`);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Received!",
        }),
    };
};