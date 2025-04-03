// libs/kafka/src/decorators/kafka-payload.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const KafkaPayloadData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const payload = ctx.switchToRpc().getData();
    // Trả về payload.data nếu có, ngược lại trả về nguyên payload
    return payload?.data !== undefined ? payload.data : payload;
  }
);
