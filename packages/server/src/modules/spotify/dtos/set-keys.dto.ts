import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetKeysDto {
  @ApiProperty({ description: 'The Spotify client ID to set' })
  @IsString()
  public clientId: string;

  @ApiProperty({ description: 'The Spotify client secret to set' })
  @IsString()
  public clientSecret: string;
}
