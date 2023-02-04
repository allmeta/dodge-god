module Server (startServer) where

import Data.Text.Lazy (Text, pack)
import Data.Text.Lazy.Encoding (decodeUtf8, encodeUtf8)
import Data.Word
import Decrypt
import Network.HTTP.Types (status200, status400)
import Web.Scotty
import Web.Scotty.Internal.Types (ActionT)

startServer :: Int -> Word8 -> IO ()
startServer port key =
  scotty port $ do
    get "/:word" $ do
      beam <- param "word"
      html $ mconcat ["<h1>Scotty, ", beam, " me up!</h1>"]
    post "/" $ do
      p <- params
      handle p key

handle :: [Param] -> Word8 -> ActionT Text IO ()
handle p key =
  case lookup "s" p of
    Just r -> parseSubmission r key
    _ -> raiseStatus status400 "submission error"

parseSubmission :: Text -> Word8 -> ActionT Text IO ()
parseSubmission r key = do
  let d = decrypt key $ encodeUtf8 r
  case d of
    Left e -> raiseStatus status400 $ pack $ show e
    Right d' -> raiseStatus status200 $ decodeUtf8 d'

-- liftIO . print . decode @ScoreSubmission .
--
