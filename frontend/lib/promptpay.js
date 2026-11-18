// สร้าง payload PromptPay (EMVCo) สำหรับพร้อมเพย์เบอร์โทร / เลขบัตรประชาชน
function tlv(id, value) {
  return id + String(value.length).padStart(2, '0') + value;
}

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function promptPayPayload(target, amount) {
  const digits = String(target).replace(/\D/g, '');
  let type = '01'; // เบอร์โทร
  let value = digits;
  if (digits.length >= 13) {
    type = '02'; // เลขบัตรประชาชน
  } else {
    value = '0066' + digits.replace(/^0/, '');
  }
  const merchant = tlv('00', 'A000000677010111') + tlv(type, value);
  let payload =
    tlv('00', '01') +
    tlv('01', amount ? '12' : '11') +
    tlv('29', merchant) +
    tlv('53', '764') +
    (amount ? tlv('54', Number(amount).toFixed(2)) : '') +
    tlv('58', 'TH');
  payload += '6304';
  return payload + crc16(payload);
}
