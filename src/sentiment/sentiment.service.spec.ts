import { SentimentService } from './sentiment.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SentimentService', () => {
  let service: SentimentService;

  beforeEach(() => {
    service = new SentimentService();
  });

  it('should call python service and return data', async () => {
    const mockResponse = { data: { sentiment: 'positive', score: 0.95 } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await service.analyze('Great product!');
    expect(result).toEqual({ sentiment: 'positive', score: 0.95 });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      { text: 'Great product!' },
      { timeout: 10000 },
    );
  });

  it('should throw when python service is unavailable', async () => {
    mockedAxios.post.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.analyze('test')).rejects.toThrow('ECONNREFUSED');
  });
});
