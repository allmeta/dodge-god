module Encrypt (encrypt) where

import Codec.Compression.Zlib qualified as Zlib
import Data.Bits (xor)
import Data.ByteString.Base64.Lazy qualified as B64
import Data.ByteString.Lazy qualified as BSL
import Data.Word (Word8)

encrypt :: Word8 -> BSL.ByteString -> BSL.ByteString
encrypt key =
  B64.encode
    . BSL.map (`xor` key)
    . Zlib.compress
