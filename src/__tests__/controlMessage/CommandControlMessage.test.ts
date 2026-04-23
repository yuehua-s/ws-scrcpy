import { CommandControlMessage } from '../../app/controlMessage/CommandControlMessage';
import { ControlMessage } from '../../app/controlMessage/ControlMessage';
import Util from '../../app/Util';

describe('CommandControlMessage.createSetClipboardCommand', () => {
    it('should create correct buffer structure for ASCII text with paste=true', () => {
        const msg = CommandControlMessage.createSetClipboardCommand('hello', true);
        const buf = msg.toBuffer();

        let offset = 0;
        // byte 0: type = TYPE_SET_CLIPBOARD (9)
        expect(buf.readInt8(offset)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        offset += 1;
        // byte 1: paste flag = 1
        expect(buf.readInt8(offset)).toBe(1);
        offset += 1;
        // bytes 2-5: text length in UTF-8 bytes (BE)
        const textLength = buf.readInt32BE(offset);
        expect(textLength).toBe(5); // "hello" = 5 bytes
        offset += 4;
        // bytes 6+: UTF-8 encoded text
        const textBytes = buf.slice(offset, offset + textLength);
        expect(textBytes.toString('utf8')).toBe('hello');
    });

    it('should create correct buffer for Chinese text "抖音" with paste=true', () => {
        const msg = CommandControlMessage.createSetClipboardCommand('抖音', true);
        const buf = msg.toBuffer();

        let offset = 0;
        expect(buf.readInt8(offset)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        offset += 1;
        expect(buf.readInt8(offset)).toBe(1); // paste = true
        offset += 1;

        const textLength = buf.readInt32BE(offset);
        expect(textLength).toBe(6); // "抖音" = 6 bytes in UTF-8
        offset += 4;

        // Verify the UTF-8 bytes match
        const expectedBytes = Util.stringToUtf8ByteArray('抖音');
        for (let i = 0; i < textLength; i++) {
            expect(buf.readUInt8(offset + i)).toBe(expectedBytes[i]);
        }

        // Total buffer size: 1 (type) + 1 (paste) + 4 (length) + 6 (text) = 12
        expect(buf.length).toBe(12);
    });

    it('should create correct buffer for mixed Chinese+ASCII text', () => {
        const text = 'hi抖音ok';
        const msg = CommandControlMessage.createSetClipboardCommand(text, true);
        const buf = msg.toBuffer();

        const expectedBytes = Util.stringToUtf8ByteArray(text);
        // "hi" = 2 bytes, "抖音" = 6 bytes, "ok" = 2 bytes → total 10
        expect(expectedBytes.length).toBe(10);

        let offset = 0;
        expect(buf.readInt8(offset)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        offset += 1;
        expect(buf.readInt8(offset)).toBe(1); // paste = true
        offset += 1;
        expect(buf.readInt32BE(offset)).toBe(10); // UTF-8 byte count
        offset += 4;

        for (let i = 0; i < expectedBytes.length; i++) {
            expect(buf.readUInt8(offset + i)).toBe(expectedBytes[i]);
        }
    });

    it('should set paste flag to 0 when paste=false', () => {
        const msg = CommandControlMessage.createSetClipboardCommand('test', false);
        const buf = msg.toBuffer();
        expect(buf.readInt8(1)).toBe(0);
    });

    it('should set paste flag to 0 when paste is omitted (default)', () => {
        const msg = CommandControlMessage.createSetClipboardCommand('test');
        const buf = msg.toBuffer();
        expect(buf.readInt8(1)).toBe(0);
    });

    it('should handle emoji text correctly', () => {
        const text = '😀';
        const msg = CommandControlMessage.createSetClipboardCommand(text, true);
        const buf = msg.toBuffer();

        const expectedBytes = Util.stringToUtf8ByteArray(text);
        expect(expectedBytes.length).toBe(4); // 😀 = 4 bytes in UTF-8

        let offset = 0;
        expect(buf.readInt8(offset)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        offset += 1;
        expect(buf.readInt8(offset)).toBe(1);
        offset += 1;
        expect(buf.readInt32BE(offset)).toBe(4);
        offset += 4;

        expect(Array.from(buf.slice(offset))).toEqual(Array.from(expectedBytes));
    });

    it('should handle empty text', () => {
        const msg = CommandControlMessage.createSetClipboardCommand('', true);
        const buf = msg.toBuffer();

        expect(buf.readInt8(0)).toBe(ControlMessage.TYPE_SET_CLIPBOARD);
        expect(buf.readInt8(1)).toBe(1);
        expect(buf.readInt32BE(2)).toBe(0);
        expect(buf.length).toBe(6); // 1 + 1 + 4 + 0
    });
});
