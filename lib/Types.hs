module Types (ScoreSubmission (..), Mode (..)) where

import Data.Aeson
import Data.Char qualified as C
import GHC.Generics (Generic)

data Mode = Mouse | Keyboard
  deriving (Enum, Show, Eq, Generic)

modeParseOptions :: Options
modeParseOptions = defaultOptions {constructorTagModifier = map C.toLower}

instance FromJSON Mode where
  parseJSON = genericParseJSON modeParseOptions

instance ToJSON Mode where
  toJSON = genericToJSON modeParseOptions

data ScoreSubmission = ScoreSubmission
  { name :: String
  , mode :: Mode
  , version :: Int
  , startTime :: Int
  , endTime :: Int
  , time :: Double
  }
  deriving (Show, Eq, Generic)

scoreSubmissionParseOptions :: Options
scoreSubmissionParseOptions = defaultOptions {fieldLabelModifier = (++) "_"}

instance FromJSON ScoreSubmission where
  parseJSON = genericParseJSON scoreSubmissionParseOptions

instance ToJSON ScoreSubmission where
  toJSON = genericToJSON scoreSubmissionParseOptions
