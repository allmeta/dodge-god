module Types (Score (..), Mode (..)) where

import Data.Aeson
import Data.Char qualified as C
import GHC.Generics (Generic)

data Mode = Mouse | Keyboard
  deriving (Enum, Show, Eq, Generic)

parseOptions :: Options
parseOptions = defaultOptions {constructorTagModifier = map C.toLower}

instance ToJSON Mode where
  toJSON = genericToJSON parseOptions

instance FromJSON Mode where
  parseJSON = genericParseJSON parseOptions

data Score = Score
  { name :: String
  , mode :: Mode
  , version :: Double
  , dodge :: Double
  , startTime :: String
  , endTime :: String
  , time :: Double
  }
  deriving (Show, Eq, Generic, FromJSON, ToJSON)
