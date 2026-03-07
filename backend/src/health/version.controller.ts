import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller('version')
export class VersionController {
  @Get()
  @ApiOperation({ summary: 'API version' })
  @ApiOkResponse({
    description: 'Version response',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  getVersion(): { version: string } {
    return { version: '1.0.0' };
  }
}
