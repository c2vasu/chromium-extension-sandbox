/**
 * MD5 Hash Implementation in JavaScript
 * --------------------------------------
 * Reference:
 * - RFC 1321: The MD5 Message-Digest Algorithm (R. Rivest, 1992)
 * - Paul Johnston's JavaScript MD5 implementation (pajhome.org.uk)
 * - blueimp-md5: https://github.com/blueimp/JavaScript-MD5
 *
 * Purpose:
 * - Computes a 128-bit MD5 hash of a string.
 * - Used in this project to derive short service IDs from namespaces.
 *
 * Core idea:
 * - MD5 processes input in 512-bit blocks.
 * - Each block goes through 64 rounds of transformations (grouped into 4 functions).
 * - The `state` (A,B,C,D) is updated and accumulated across blocks.
 * - Output: 128-bit digest represented as a hex string.
 */

/**
 * Process one 512-bit block (64 bytes) of input.
 *
 * @param {number[]} x - Current state (array of 4 integers: A,B,C,D).
 * @param {number[]} k - Array of 16 integers derived from 64-byte input chunk.
 */
function md5cycle(x, k) {
  // Initialize working variables from state
  var a = x[0], b = x[1], c = x[2], d = x[3];

  /**
   * Core transformation function used by all four MD5 round functions.
   * - Rotates left and adds constants as defined in RFC 1321.
   */
  function cmn(q,a,b,x,s,t){
    a = ((a + q) | 0) + ((x + t) | 0);
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }

  // Round 1 function: F(X,Y,Z) = (X & Y) | (~X & Z)
  function ff(a,b,c,d,x,s,t){ return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  // Round 2 function: G(X,Y,Z) = (X & Z) | (Y & ~Z)
  function gg(a,b,c,d,x,s,t){ return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  // Round 3 function: H(X,Y,Z) = X ^ Y ^ Z
  function hh(a,b,c,d,x,s,t){ return cmn(b ^ c ^ d, a, b, x, s, t); }
  // Round 4 function: I(X,Y,Z) = Y ^ (X | ~Z)
  function ii(a,b,c,d,x,s,t){ return cmn(c ^ (b | (~d)), a, b, x, s, t); }

  // --- 64 Transformation Operations (organized in 4 groups of 16) ---
  // Each operation updates a,b,c,d using one of ff/gg/hh/ii
  // with different shift amounts (s) and constants (t).
  // Constants are derived from the sine function as per RFC 1321.

  // Round 1 (functions ff, 16 ops)
  a=ff(a,b,c,d,k[0],7,-680876936);
  d=ff(d,a,b,c,k[1],12,-389564586);
  c=ff(c,d,a,b,k[2],17,606105819);
  b=ff(b,c,d,a,k[3],22,-1044525330);
  a=ff(a,b,c,d,k[4],7,-176418897);
  d=ff(d,a,b,c,k[5],12,1200080426);
  c=ff(c,d,a,b,k[6],17,-1473231341);
  b=ff(b,c,d,a,k[7],22,-45705983);
  a=ff(a,b,c,d,k[8],7,1770035416);
  d=ff(d,a,b,c,k[9],12,-1958414417);
  c=ff(c,d,a,b,k[10],17,-42063);
  b=ff(b,c,d,a,k[11],22,-1990404162);
  a=ff(a,b,c,d,k[12],7,1804603682);
  d=ff(d,a,b,c,k[13],12,-40341101);
  c=ff(c,d,a,b,k[14],17,-1502002290);
  b=ff(b,c,d,a,k[15],22,1236535329);

  // Round 2 (functions gg, 16 ops)
  a=gg(a,b,c,d,k[1],5,-165796510);
  d=gg(d,a,b,c,k[6],9,-1069501632);
  c=gg(c,d,a,b,k[11],14,643717713);
  b=gg(b,c,d,a,k[0],20,-373897302);
  a=gg(a,b,c,d,k[5],5,-701558691);
  d=gg(d,a,b,c,k[10],9,38016083);
  c=gg(c,d,a,b,k[15],14,-660478335);
  b=gg(b,c,d,a,k[4],20,-405537848);
  a=gg(a,b,c,d,k[9],5,568446438);
  d=gg(d,a,b,c,k[14],9,-1019803690);
  c=gg(c,d,a,b,k[3],14,-187363961);
  b=gg(b,c,d,a,k[8],20,1163531501);
  a=gg(a,b,c,d,k[13],5,-1444681467);
  d=gg(d,a,b,c,k[2],9,-51403784);
  c=gg(c,d,a,b,k[7],14,1735328473);
  b=gg(b,c,d,a,k[12],20,-1926607734);

  // Round 3 (functions hh, 16 ops)
  a=hh(a,b,c,d,k[5],4,-378558);
  d=hh(d,a,b,c,k[8],11,-2022574463);
  c=hh(c,d,a,b,k[11],16,1839030562);
  b=hh(b,c,d,a,k[14],23,-35309556);
  a=hh(a,b,c,d,k[1],4,-1530992060);
  d=hh(d,a,b,c,k[4],11,1272893353);
  c=hh(c,d,a,b,k[7],16,-155497632);
  b=hh(b,c,d,a,k[10],23,-1094730640);
  a=hh(a,b,c,d,k[13],4,681279174);
  d=hh(d,a,b,c,k[0],11,-358537222);
  c=hh(c,d,a,b,k[3],16,-722521979);
  b=hh(b,c,d,a,k[6],23,76029189);
  a=hh(a,b,c,d,k[9],4,-640364487);
  d=hh(d,a,b,c,k[12],11,-421815835);
  c=hh(c,d,a,b,k[15],16,530742520);
  b=hh(b,c,d,a,k[2],23,-995338651);

  // Round 4 (functions ii, 16 ops)
  a=ii(a,b,c,d,k[0],6,-198630844);
  d=ii(d,a,b,c,k[7],10,1126891415);
  c=ii(c,d,a,b,k[14],15,-1416354905);
  b=ii(b,c,d,a,k[5],21,-57434055);
  a=ii(a,b,c,d,k[12],6,1700485571);
  d=ii(d,a,b,c,k[3],10,-1894986606);
  c=ii(c,d,a,b,k[10],15,-1051523);
  b=ii(b,c,d,a,k[1],21,-2054922799);
  a=ii(a,b,c,d,k[8],6,1873313359);
  d=ii(d,a,b,c,k[15],10,-30611744);
  c=ii(c,d,a,b,k[6],15,-1560198380);
  b=ii(b,c,d,a,k[13],21,1309151649);
  a=ii(a,b,c,d,k[4],6,-145523070);
  d=ii(d,a,b,c,k[11],10,-1120210379);
  c=ii(c,d,a,b,k[2],15,718787259);
  b=ii(b,c,d,a,k[9],21,-343485551);

  // Update state with transformed values (modulo 2^32).
  x[0] = (x[0] + a) | 0;
  x[1] = (x[1] + b) | 0;
  x[2] = (x[2] + c) | 0;
  x[3] = (x[3] + d) | 0;
}

/**
 * md5blk: Convert a 64-byte string chunk into an array of 16 32-bit words.
 */
function md5blk(s) {
  var md5blks = [], i;
  for (i = 0; i < 64; i += 4) {
    md5blks[i >> 2] = s.charCodeAt(i) +
      (s.charCodeAt(i+1) << 8) +
      (s.charCodeAt(i+2) << 16) +
      (s.charCodeAt(i+3) << 24);
  }
  return md5blks;
}

/**
 * md51: Process an entire string input, chunk by chunk,
 *       padding per MD5 spec, returns the final [A,B,C,D] state array.
 */
function md51(s) {
  var n = s.length;
  var state = [1732584193, -271733879, -1732584194, 271733878]; // Initial MD5 constants (IV)
  var i;

  // Process each 64-byte block
  for (i = 64; i <= s.length; i += 64) {
    md5cycle(state, md5blk(s.substring(i-64, i)));
  }

  // Tail block: remaining <64 bytes
  s = s.substring(i-64);
  var tail = new Array(16).fill(0);

  // Copy remaining chars into tail
  for (i = 0; i < s.length; i++) {
    tail[i >> 2] |= s.charCodeAt(i) << ((i%4) << 3);
  }

  // Add MD5 padding: 0x80 followed by zeros
  tail[s.length >> 2] |= 0x80 << ((s.length % 4) << 3);

  // If overflowed 56 bytes, process tail now, then reset
  if (s.length > 55) {
    md5cycle(state, tail);
    tail = new Array(16).fill(0);
  }

  // Append message length in bits (little-endian) at word 14
  tail[14] = n * 8;

  // Final block
  md5cycle(state, tail);
  return state;
}

/**
 * Convert a 32-bit integer to 8 hex characters (little-endian order).
 */
var hex_chr = '0123456789abcdef'.split('');
function rhex(n) {
  var s = '', j = 0;
  for (; j < 4; j++) {
    s += hex_chr[(n >> (j*8+4)) & 0x0F] +
         hex_chr[(n >> (j*8)) & 0x0F];
  }
  return s;
}

/**
 * Convert state array [A,B,C,D] into full 128-bit hex string.
 */
function hex(x) {
  for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
  return x.join('');
}

/**
 * Public API: Compute MD5 hash of a string.
 *
 * @param {string} s - Input string.
 * @returns {string} - 32-char hex string (128-bit MD5 digest).
 */
function md5(s) {
  return hex(md51(s));
}
