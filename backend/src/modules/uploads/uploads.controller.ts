import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UploadedImageFile, UploadsService } from './uploads.service';

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.vendor, Role.admin)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_IMAGE_UPLOAD_BYTES,
      },
    }),
  )
  @ApiOperation({ summary: 'Upload image (vendor/admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://uploads.local/uploads/123-image.jpg' },
        key: { type: 'string', example: 'uploads/123-image.jpg' },
      },
    },
  })
  async uploadImage(@UploadedFile() file?: UploadedImageFile) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.uploadsService.uploadImage(file);
  }
}
