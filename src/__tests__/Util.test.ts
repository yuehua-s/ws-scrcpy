import Util from '../app/Util';

describe('Util.stringToUtf8ByteArray', () => {
    it('should encode ASCII text correctly', () => {
        const bytes = Util.stringToUtf8ByteArray('hello');
        expect(Array.from(bytes)).toEqual([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
    });

    it('should encode Chinese characters correctly', () => {
        // "抖音" in UTF-8: E6 8A 96 E9 9F B3
        const bytes = Util.stringToUtf8ByteArray('抖音');
        expect(Array.from(bytes)).toEqual([0xe6, 0x8a, 0x96, 0xe9, 0x9f, 0xb3]);
    });

    it('should encode "微信" correctly', () => {
        // "微信" in UTF-8: E5 BE AE E4 BF A1
        const bytes = Util.stringToUtf8ByteArray('微信');
        expect(Array.from(bytes)).toEqual([0xe5, 0xbe, 0xae, 0xe4, 0xbf, 0xa1]);
    });

    it('should encode mixed Chinese and ASCII text correctly', () => {
        // "hi你好" → 68 69 E4 BD A0 E5 A5 BD
        const bytes = Util.stringToUtf8ByteArray('hi你好');
        expect(Array.from(bytes)).toEqual([0x68, 0x69, 0xe4, 0xbd, 0xa0, 0xe5, 0xa5, 0xbd]);
    });

    it('should encode emoji (surrogate pair) correctly', () => {
        // "😀" U+1F600 → F0 9F 98 80
        const bytes = Util.stringToUtf8ByteArray('😀');
        expect(Array.from(bytes)).toEqual([0xf0, 0x9f, 0x98, 0x80]);
    });

    it('should handle empty string', () => {
        const bytes = Util.stringToUtf8ByteArray('');
        expect(bytes.length).toBe(0);
    });

    it('should return correct byte length (not character length) for Chinese', () => {
        // Each Chinese character is 3 bytes in UTF-8, NOT 1
        const text = '抖音';
        const bytes = Util.stringToUtf8ByteArray(text);
        expect(text.length).toBe(2); // JS string length = 2
        expect(bytes.length).toBe(6); // UTF-8 byte length = 6
    });
});

describe('Util.utf8ByteArrayToString', () => {
    it('should roundtrip ASCII text', () => {
        const original = 'hello world';
        const bytes = Util.stringToUtf8ByteArray(original);
        const result = Util.utf8ByteArrayToString(bytes);
        expect(result).toBe(original);
    });

    it('should roundtrip Chinese text', () => {
        const original = '抖音';
        const bytes = Util.stringToUtf8ByteArray(original);
        const result = Util.utf8ByteArrayToString(bytes);
        expect(result).toBe(original);
    });

    it('should roundtrip mixed text', () => {
        const original = 'hello抖音world微信123';
        const bytes = Util.stringToUtf8ByteArray(original);
        const result = Util.utf8ByteArrayToString(bytes);
        expect(result).toBe(original);
    });

    it('should roundtrip emoji', () => {
        const original = '😀🎉';
        const bytes = Util.stringToUtf8ByteArray(original);
        const result = Util.utf8ByteArrayToString(bytes);
        expect(result).toBe(original);
    });
});
