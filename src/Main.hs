module Main where

import Data.Text.Lazy (pack)
import Data.Word
import Decrypt
import System.Environment (getEnv)
import Web.Scotty

main :: IO ()
main = do
  key <- read @Word8 <$> getEnv "KEY"
  startServer key

startServer :: Word8 -> IO ()
startServer key =
  scotty 3000 $ do
    get "/:word" $ do
      beam <- param "word"
      html $ mconcat ["<h1>Scotty, ", beam, " me up!</h1>"]
    post "/" $ do
      s <- param "s"
      let d = decrypt key s
      text $ pack d
