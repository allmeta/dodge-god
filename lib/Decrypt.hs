module Decrypt (decrypt) where

import Codec.Compression.Zlib qualified as Zlib
import Data.Bits (xor)
import Data.ByteString.Base64 qualified as B64
import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as BSL
import Data.ByteString.Lazy.Char8 qualified as BSCL
import Data.Word (Word8)

decrypt :: Word8 -> String -> String
decrypt key =
  BSCL.unpack
    . Zlib.decompress
    . BSL.map (`xor` key)
    . BSL.fromStrict
    . B64.decodeLenient
    . BS.pack
