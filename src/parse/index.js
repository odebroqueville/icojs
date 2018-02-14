'use strict';

const decodeIco = require('decode-ico');

/**
 * @typedef {Object} ParsedImage
 * @property {Number} width Image width.
 * @property {Number} height Image height.
 * @property {Number} bpp Image color depth as bits per pixel.
 * @property {ArrayBuffer} buffer Image buffer.
 */

/**
 * Parse ICO and return some image object.
 * @access private
 * @param {ArrayBuffer|Buffer} data ICO file data.
 * @param {String} mime MIME type for output.
 * @param {Object} Image Image encoder/decoder
 * @returns {Promise<ParsedImage[]>} Resolves to an array of {@link ParsedImage}.
 */
const parse = (data, mime, Image) => {
  let icons = null;

  try {
    icons = decodeIco(data);
  } catch (err) {
    return Promise.reject(err);
  }

  const decodePng = icon => {
    if (icon.type !== 'png') {
      return Promise.resolve(icon);
    }

    return Image.decode(icon.data).then(decoded => Object.assign(icon, {
      type: 'bmp',
      data: decoded.data
    }));
  };

  const encodeImage = icon => Image.encode(icon, mime).then(encoded => Object.assign(icon, {
    type: mime.replace('image/', ''),
    buffer: encoded
  }));

  const transcodeImage = icon => {
    if (mime === 'image/png' && icon.type === 'png') {
      return Promise.resolve(Object.assign({ buffer: icon.data.buffer.slice(icon.data.byteOffset, icon.data.byteOffset + icon.data.byteLength) }, icon));
    }
    return decodePng(icon).then(encodeImage);
  };

  return Promise.all(icons.map(transcodeImage));
};

module.exports = parse;
