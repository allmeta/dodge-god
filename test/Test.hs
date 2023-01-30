module Main where

import ArbitraryInstances ()
import Data.Aeson qualified as JSON
import Decrypt
import Encrypt
import Test.Tasty
import Test.Tasty.HUnit
import Test.Tasty.QuickCheck
import Types

main :: IO ()
main = defaultMain tests

tests :: TestTree
tests =
  testGroup
    "Tests"
    [ testCase "decrypt" $ input @=? decrypt key encrypted
    , testCase "encrypt" $ encrypted @=? encrypt key input
    , testCase "decrypt == encrypted" $ input @=? decrypt key (encrypt key input)
    , testCase "encrypt" $ encrypted @=? encrypt key input
    , testProperty "'Score's JSON encoding and decoding are bijective" $
       -- run 100 test cases for the property
       withMaxSuccess 100 scoreEncodingIsBijective
    ]
  where
    key = 123
    input = "123"
    encrypted = "A+dIT0l9e3pWe+w="

-- Encoding and decoding a 'Score' to JSON should return the value you started with
scoreEncodingIsBijective :: Score -> Bool
scoreEncodingIsBijective score = Just score == JSON.decode (JSON.encode score)
