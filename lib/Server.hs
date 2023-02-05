module Server (startServer) where

import Data.ByteString.Lazy (ByteString)
import Data.Text.Lazy (Text)
import Data.Text.Lazy qualified as T
import Data.Text.Lazy.Encoding (decodeUtf8, encodeUtf8)
import Data.Word
import Decrypt
import Network.HTTP.Types (status400)
import Web.Scotty

startServer :: Int -> Word8 -> IO ()
startServer port key =
  scotty port $ do
    get "/:word" $ do
      beam <- param "word"
      html $ mconcat ["<h1>Scotty, ", beam, " me up!</h1>"]
    post "/" $ do
      p <- params
      res <- handle p key
      text $ decodeUtf8 res

handle :: [Param] -> Word8 -> ActionM ByteString
handle p key =
  case lookup "s" p of
    Just r -> parseSubmission r key
    _ -> raiseStatus status400 "submission error"

parseSubmission :: Text -> Word8 -> ActionM ByteString
parseSubmission r key =
  either
    (raiseStatus status400 . T.pack . show)
    pure
    (decrypt key $ encodeUtf8 r)
