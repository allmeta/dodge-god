module Decrypt (decrypt) where

import Codec.Compression.Zlib.Internal
  ( DecompressError
  , decompressST
  , defaultDecompressParams
  , foldDecompressStreamWithInput
  , zlibFormat
  )
import Data.Bits (xor)
import Data.ByteString.Base64.Lazy qualified as B64
import Data.ByteString.Lazy qualified as BSL
import Data.ByteString.Lazy.Internal qualified as BSL
import Data.Word (Word8)

decrypt :: Word8 -> BSL.ByteString -> Either DecompressError BSL.ByteString
decrypt key =
  foldDecompressStreamWithInput
    (\c rest -> BSL.chunk c <$> rest)
    Right
    Left
    (decompressST zlibFormat defaultDecompressParams)
    . BSL.map (`xor` key)
    . B64.decodeLenient
