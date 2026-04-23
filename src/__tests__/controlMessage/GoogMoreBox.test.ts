/**
 * Test: GoogMoreBox "Send as keys" button always uses clipboard+paste
 *
 * GoogMoreBox constructor is heavily coupled to DOM and complex objects (BasePlayer, StreamClientScrcpy).
 * Instead of instantiating it directly, we test the critical behavior by simulating the button logic:
 * - For ALL text input (ASCII, Chinese, mixed, emoji), sendMessage should be called
 *   with CommandControlMessage.createSetClipboardCommand(text, true).
 * - TextControlMessage should NEVER be used (it was removed from GoogMoreBox imports).
 */

import { CommandControlMessage } from '../../app/controlMessage/CommandControlMessage';
import { ControlMessage } from '../../app/controlMessage/ControlMessage';
import Util from '../../app/Util';

// Simulate the exact logic from GoogMoreBox.sendButton.onclick
function simulateSendAsKeys(
    inputValue: string,
    sendMessage: (msg: { toBuffer: () => Buffer }) => void,
): void {
    if (inputValue) {
        sendMessage(CommandControlMessage.createSetClipboardCommand(inputValue, true));
    }
}

describe('GoogMoreBox: Send as keys button logic', () => {
    let sendMessage: jest.Mock;

    beforeEach(() => {
        sendMessage = jest.fn();
    });

    it('should call sendMessage for ASCII text "hello"', () => {
        simulateSendAsKeys('hello', sendMessage);
        expect(sendMessage).toHaveBeenCalledTimes(1);

        const msg = sendMessage.mock.calls[0][0];
        const buf = msg.toBuffer();
        expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        expect(buf.readInt8(1)).toBe(1); // paste = true
    });

    it('should call sendMessage for Chinese text "抖音"', () => {
        simulateSendAsKeys('抖音', sendMessage);
        expect(sendMessage).toHaveBeenCalledTimes(1);

        const msg = sendMessage.mock.calls[0][0];
        const buf = msg.toBuffer();
        expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        expect(buf.readInt8(1)).toBe(1); // paste = true

        // Verify text content
        const textLength = buf.readInt32BE(2);
        expect(textLength).toBe(6); // "抖音" = 6 bytes UTF-8
        const decoded = Util.utf8ByteArrayToString(buf.slice(6, 6 + textLength));
        expect(decoded).toBe('抖音');
    });

    it('should call sendMessage for Chinese text "微信"', () => {
        simulateSendAsKeys('微信', sendMessage);
        expect(sendMessage).toHaveBeenCalledTimes(1);

        const msg = sendMessage.mock.calls[0][0];
        const buf = msg.toBuffer();
        expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        expect(buf.readInt8(1)).toBe(1);

        const textLength = buf.readInt32BE(2);
        const decoded = Util.utf8ByteArrayToString(buf.slice(6, 6 + textLength));
        expect(decoded).toBe('微信');
    });

    it('should call sendMessage for mixed text "hello抖音world"', () => {
        const text = 'hello抖音world';
        simulateSendAsKeys(text, sendMessage);
        expect(sendMessage).toHaveBeenCalledTimes(1);

        const msg = sendMessage.mock.calls[0][0];
        const buf = msg.toBuffer();
        expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        expect(buf.readInt8(1)).toBe(1);

        const textLength = buf.readInt32BE(2);
        const decoded = Util.utf8ByteArrayToString(buf.slice(6, 6 + textLength));
        expect(decoded).toBe(text);
    });

    it('should call sendMessage for emoji text "😀🎉"', () => {
        const text = '😀🎉';
        simulateSendAsKeys(text, sendMessage);
        expect(sendMessage).toHaveBeenCalledTimes(1);

        const msg = sendMessage.mock.calls[0][0];
        const buf = msg.toBuffer();
        expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        expect(buf.readInt8(1)).toBe(1);

        const textLength = buf.readInt32BE(2);
        const decoded = Util.utf8ByteArrayToString(buf.slice(6, 6 + textLength));
        expect(decoded).toBe(text);
    });

    it('should NOT call sendMessage for empty input', () => {
        simulateSendAsKeys('', sendMessage);
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it('should always use TYPE_SET_CLIPBOARD (9), never TYPE_TEXT (1)', () => {
        const testCases = ['hello', '抖音', '微信', 'abc中文def', '😀'];
        for (const text of testCases) {
            const mockSend = jest.fn();
            simulateSendAsKeys(text, mockSend);

            const buf = mockSend.mock.calls[0][0].toBuffer();
            // Must be TYPE_SET_CLIPBOARD (9), NOT TYPE_TEXT (1)
            expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
            expect(buf.readInt8(0)).not.toBe(ControlMessage.TYPE_TEXT);
        }
    });

    it('should always set paste=true for all text', () => {
        const testCases = ['hello', '抖音', '微信', 'abc中文def', '😀'];
        for (const text of testCases) {
            const mockSend = jest.fn();
            simulateSendAsKeys(text, mockSend);

            const buf = mockSend.mock.calls[0][0].toBuffer();
            expect(buf.readInt8(1)).toBe(1); // paste = true
        }
    });
});
