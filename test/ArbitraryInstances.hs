{-# OPTIONS_GHC -fno-warn-orphans #-}

module ArbitraryInstances () where

import Test.Tasty.QuickCheck (Arbitrary (..), chooseEnum, elements, listOf)
import Types

instance Arbitrary Mode where
  arbitrary = chooseEnum (Mouse, Keyboard)

instance Arbitrary Score where
  arbitrary = do
    name <- alphanum
    mode <- arbitrary
    version <- arbitrary
    dodge <- arbitrary
    startTime <- arbitrary
    endTime <- arbitrary
    time <- arbitrary
    pure $ Score name mode version dodge startTime endTime time
    where
      alphanum = listOf . elements $ ['a' .. 'z'] <> ['0' .. '9']
