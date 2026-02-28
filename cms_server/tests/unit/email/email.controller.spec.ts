/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SendCodeDto } from '../../../src/email/dto/send-code.dto';
import { EmailController } from '../../../src/email/email.controller';
import { EmailService } from '../../../src/email/email.service';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendCode: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('控制器实例应被正确定义', () => {
    expect(controller).toBeDefined();
  });

  describe('sendCode', () => {
    const sendCodeDto: SendCodeDto = {
      email: 'test@example.com',
      type: 'register',
    };

    it('应调用 emailService.sendCode 并返回结果', async () => {
      // Arrange
      const expectedResult = { success: true };
      jest.spyOn(emailService, 'sendCode').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.sendCode(sendCodeDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailService.sendCode).toHaveBeenCalledWith(sendCodeDto);
    });

    it('应传递正确的 DTO 参数给服务', async () => {
      // Arrange
      const mockResult = { success: true };
      jest.spyOn(emailService, 'sendCode').mockResolvedValue(mockResult);

      // Act
      await controller.sendCode(sendCodeDto);

      // Assert
      expect(emailService.sendCode).toHaveBeenCalledWith(sendCodeDto);
    });

    it('当服务抛出异常时，应将异常向上传播', async () => {
      // Arrange
      const errorMessage = 'Failed to send email';
      jest
        .spyOn(emailService, 'sendCode')
        .mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.sendCode(sendCodeDto)).rejects.toThrow(
        errorMessage,
      );
    });

    it('当类型为 update 时，应正确传递参数', async () => {
      // Arrange
      const updateDto: SendCodeDto = {
        email: 'user@example.com',
        type: 'update',
      };
      const expectedResult = { success: true };
      jest.spyOn(emailService, 'sendCode').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.sendCode(updateDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailService.sendCode).toHaveBeenCalledWith(updateDto);
    });
  });
});
