"""
Tests for Jev Answer Verifier:
Verifies that Jev correctly calculates probability of correctness (Noul),
categorical accuracy (Choice), and quality scoring (Score).
"""
import pytest
from jev_engine import JevEngine, _softmax


def test_softmax_math():
    scores = [1.0, 2.0, 3.0]
    probs = _softmax(scores)
    assert abs(sum(probs) - 1.0) < 0.01
    assert probs[2] > probs[1] > probs[0]


def test_correct_answer_evaluation():
    engine = JevEngine()
    question = "What is the capital city of France?"
    expected = "Paris"
    user_answer = "Paris, the capital of France"

    res = engine.evaluate_answer(question, expected, user_answer)

    # Noul: must be True with high probability
    assert res["verdict"]["is_correct"] is True
    assert res["primitives"]["noul"]["probability"] > 0.8
    assert res["primitives"]["noul"]["decision"] is True

    # Choice: winning choice must be 'correct'
    assert res["primitives"]["choice"]["winner"] == "correct"

    # Score: must be high on continuous 0-2 scale (> 1.5)
    assert res["primitives"]["score"]["score"] >= 1.5


def test_incorrect_answer_evaluation():
    engine = JevEngine()
    question = "What is 15 multiplied by 8?"
    expected = "120"
    user_answer = "The answer is 500"

    res = engine.evaluate_answer(question, expected, user_answer)

    # Noul: must be False with low probability
    assert res["verdict"]["is_correct"] is False
    assert res["primitives"]["noul"]["probability"] < 0.2
    assert res["primitives"]["noul"]["decision"] is False

    # Choice: winning choice must be 'incorrect'
    assert res["primitives"]["choice"]["winner"] == "incorrect"

    # Score: must be low (< 0.5)
    assert res["primitives"]["score"]["score"] < 0.5


def test_partially_correct_answer():
    engine = JevEngine()
    question = "What is the primary function of mitochondria in human cells?"
    expected = "Powerhouse of the cell, produces energy and ATP"
    user_answer = "It helps the cell with some energy"

    res = engine.evaluate_answer(question, expected, user_answer)
    choice_winner = res["primitives"]["choice"]["winner"]
    
    # Should register positive probability for partial or correct
    assert res["primitives"]["choice"]["probabilities"]["partially_correct"] > 0.3
    assert 0.4 <= res["primitives"]["score"]["score"] <= 1.8
