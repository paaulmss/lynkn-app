import { Logger } from '@nestjs/common';
import { moderatePost } from '../src/posts/post-moderation';

const generate = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({ getGenerativeModel: () => ({ generateContent: (...args: unknown[]) => generate(...args) }) })),
}));
const response = (text: string, finishReason = 'STOP') => ({ response: {
  text: () => text, candidates: [{ finishReason }],
} });
const moderate = () => moderatePost(Buffer.from('test image'), 'image/jpeg', 'Paseo', 'Conocer Madrid');

describe('post moderation', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-only-key';
    generate.mockReset();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });
  it('accepts only a complete approval', async () => {
    generate.mockResolvedValue(response('APROBADO'));
    await expect(moderate()).resolves.toBeUndefined();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate.mock.calls[0][1]).toEqual({ timeout: 12000 });
  });
  it('recovers from one temporary provider failure', async () => {
    generate.mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce(response('APROBADO'));
    await expect(moderate()).resolves.toBeUndefined();
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it('stops after two quota failures and never logs the raw error', async () => {
    generate.mockRejectedValue({ status: 429, message: 'secret-url-and-image-payload' });
    await expect(moderate()).rejects.toMatchObject({ response: { code: 'MODERATION_UNAVAILABLE' } });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(jest.mocked(Logger.prototype.warn).mock.calls)).not.toContain('secret-url');
  });
  it('does not retry an invalid input request', async () => {
    generate.mockRejectedValue({ status: 400 });
    await expect(moderate()).rejects.toMatchObject({ status: 503 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it('rejects unsafe content without retrying', async () => {
    generate.mockResolvedValue(response('RECHAZADO'));
    await expect(moderate()).rejects.toMatchObject({ status: 400 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it('does not publish on a truncated approval or unexpected decision', async () => {
    generate.mockResolvedValueOnce(response('APROBADO', 'MAX_TOKENS')).mockResolvedValueOnce(response('Maybe'));
    await expect(moderate()).rejects.toMatchObject({ status: 503 });
    await expect(moderate()).rejects.toMatchObject({ status: 503 });
  });
  it('treats provider safety blocking as a content rejection', async () => {
    generate.mockResolvedValue({ response: { promptFeedback: { blockReason: 'SAFETY' } } });
    await expect(moderate()).rejects.toMatchObject({ status: 400 });
  });
  it('never calls Gemini if the key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(moderate()).rejects.toMatchObject({ status: 503 });
    expect(generate).not.toHaveBeenCalled();
  });
});
