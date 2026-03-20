import struct
import zlib

def write_png(width, height, filename):
    png_signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr_chunk = struct.pack('!I4s', len(ihdr_data), b'IHDR') + ihdr_data + struct.pack('!I', ihdr_crc)
    scanline = b'\x00' + b'\x00\x00\x00' * width
    raw_data = scanline * height
    compressed = zlib.compress(raw_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    idat_chunk = struct.pack('!I4s', len(compressed), b'IDAT') + compressed + struct.pack('!I', idat_crc)
    iend_crc = zlib.crc32(b'IEND')
    iend_chunk = struct.pack('!I4s', 0, b'IEND') + struct.pack('!I', iend_crc)
    with open(filename, 'wb') as f:
        f.write(png_signature)
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)

write_png(192, 192, 'myphnoe/icon-192.png')
write_png(512, 512, 'myphnoe/icon-512.png')
