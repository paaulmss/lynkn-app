import { Transform, Type } from 'class-transformer';
import { Equals, IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

const normalize = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class AvailabilityDto {
  @Transform(normalize) @IsEmail() @MaxLength(254) email!: string;
  @Transform(normalize) @Matches(/^[a-z0-9_]{3,25}$/) username!: string;
}
export class RegisterDto extends AvailabilityDto {
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
  @IsDateString({ strict: true }) birth_day!: string;
  @Equals(true) terms_accepted!: boolean;
  @IsOptional() @IsString() @MaxLength(5000000) foto_perfil?: string;
  @IsOptional() @IsString() @MaxLength(5000000) selfie?: string;
}
export class LoginDto {
  @Transform(normalize) @IsString() @Length(1, 254) identifier!: string;
  @IsString() @Length(1, 1024) password!: string;
}
export class GoogleTokenDto { @IsString() @Length(1, 10000) token!: string; }
export class SupabaseTokenDto { @IsString() @Length(1, 10000) accessToken!: string; }
export class ReverifyDto {
  @IsString() @Matches(/^data:image\/(jpeg|png|webp);base64,/) @MaxLength(5000000) imageBase64!: string;
}
export class PreferencesDto {
  @IsIn(['light', 'dark']) theme!: 'light' | 'dark';
  @IsIn(['es', 'en']) language!: 'es' | 'en';
}
export class ProfileDto {
  @Transform(normalize) @Matches(/^[a-z0-9_]{3,25}$/) username!: string;
  @IsOptional() @IsString() @MaxLength(160) bio?: string;
  @IsOptional() @IsString() @MaxLength(50) location?: string;
  @IsOptional() @IsDateString({ strict: true }) birth_day?: string;
  @IsOptional() @IsString() @MaxLength(5000000) foto_perfil?: string;
}
export class VerificationDto {
  @IsIn(['approved', 'rejected', 'pending', 'unverified']) status!: 'approved' | 'rejected' | 'pending' | 'unverified';
  @IsOptional() @IsString() @MaxLength(500) message?: string;
}
export class RoleDto { @IsIn(['admin', 'user']) role!: 'admin' | 'user'; }
export class VisibilityDto { @IsBoolean() is_visible!: boolean; }
export class ParticipationDto { @IsIn(['accepted', 'rejected']) status!: 'accepted' | 'rejected'; }
export class CreatePostDto {
  @IsString() @Length(1, 120) title!: string;
  @IsString() @Length(1, 5000) description!: string;
  @IsOptional() @IsString() @MaxLength(60) category?: string;
  @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat!: number;
  @Type(() => Number) @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) max_participants?: number;
  @IsOptional() @IsDateString({ strict: true }) event_date?: string;
}
export class SearchDto {
  @IsOptional() @IsString() @MaxLength(100) q = '';
}
export class ChatPostDto { @IsInt() @Min(1) postId!: number; }
export class ChatMessageDto extends ChatPostDto {
  @IsString() @Matches(/\S/) @MaxLength(4000) content!: string;
}

export class ChatHistoryQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) before?: number;
}
