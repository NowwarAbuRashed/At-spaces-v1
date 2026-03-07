import { Body, Controller, HttpCode, HttpStatus, NotImplementedException, Post } from '@nestjs/common';
import { ApiNotImplementedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiRecommendRequestDto } from './dto/ai-recommend-request.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  @Post('recommend')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'AI branch recommendation (optional)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  })
  @ApiNotImplementedResponse({ description: 'Not implemented' })
  recommend(@Body() _: AiRecommendRequestDto) {
    throw new NotImplementedException('AI recommendation is not implemented');
  }
}
