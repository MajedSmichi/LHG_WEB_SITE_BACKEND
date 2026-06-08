import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      conversation: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirstOrThrow: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      message: {
        create: jest.fn(),
      },
    };
    service = new ConversationsService(prisma);
  });

  describe('create', () => {
    it('should create a conversation with title', async () => {
      const conv = { id: 1, userId: 1, title: 'Test' };
      prisma.conversation.create.mockResolvedValue(conv);

      const result = await service.create(1, 'Test');
      expect(result).toEqual(conv);
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { userId: 1, title: 'Test' },
      });
    });

    it('should use default title if none provided', async () => {
      prisma.conversation.create.mockResolvedValue({ id: 1 });
      await service.create(1);
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { userId: 1, title: 'Nouvelle conversation' },
      });
    });
  });

  describe('findAllByUser', () => {
    it('should return conversations and total', async () => {
      const convs = [{ id: 1, title: 'Conv1' }];
      prisma.conversation.findMany.mockResolvedValue(convs);
      prisma.conversation.count.mockResolvedValue(1);

      const result = await service.findAllByUser(1);
      expect(result).toEqual({ conversations: convs, total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return conversation with messages', async () => {
      const conv = { id: 1, messages: [] };
      prisma.conversation.findFirstOrThrow.mockResolvedValue(conv);

      const result = await service.findOne(1, 1);
      expect(result).toEqual(conv);
    });
  });

  describe('update', () => {
    it('should update conversation', async () => {
      const updated = { id: 1, title: 'Updated' };
      prisma.conversation.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { title: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a conversation', async () => {
      const conv = { id: 1, userId: 1 };
      prisma.conversation.delete.mockResolvedValue(conv);

      const result = await service.delete(1, 1);
      expect(result).toEqual(conv);
    });
  });

  describe('addMessage', () => {
    it('should add a user message', async () => {
      prisma.conversation.findFirstOrThrow.mockResolvedValue({ id: 1, userId: 1 });
      const msg = { id: 1, conversationId: 1, role: 'user', question: 'hello', response: 'hi' };
      prisma.conversationMessage = { create: jest.fn().mockResolvedValue(msg) };

      const result = await service.addMessage(1, 1, 'user', 'hello', 'hi');
      expect(result).toEqual(msg);
    });

    it('should increment questionCount for assistant role', async () => {
      prisma.conversation.findFirstOrThrow.mockResolvedValue({ id: 1, userId: 1 });
      prisma.conversationMessage = { create: jest.fn().mockResolvedValue({ id: 1, role: 'assistant' }) };
      prisma.conversation.update.mockResolvedValue({});

      await service.addMessage(1, 1, 'assistant', null, 'response');
      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });
  });

  describe('updateTitle', () => {
    it('should update title', async () => {
      prisma.conversation.update.mockResolvedValue({ id: 1, title: 'New title' });
      const result = await service.updateTitle(1, 1, 'New title');
      expect(result).toEqual({ id: 1, title: 'New title' });
    });
  });

  describe('togglePin', () => {
    it('should toggle pin status', async () => {
      prisma.conversation.findFirstOrThrow.mockResolvedValue({ id: 1, userId: 1, isPinned: false });
      prisma.conversation.update.mockResolvedValue({ id: 1, isPinned: true });

      const result = await service.togglePin(1, 1);
      expect(result).toEqual({ id: 1, isPinned: true });
    });
  });
});
