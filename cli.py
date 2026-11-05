#!/usr/bin/env python3
"""
Jev Answer Verifier CLI:
Interactive terminal mode to test Jev's probability decision engine directly.
"""
from jev_engine import JevEngine

engine = JevEngine()

QUESTIONS = [
    ("What is the capital city of France?", "Paris"),
    ("What is the primary function of mitochondria in human cells?", "Powerhouse of the cell, produces energy and ATP"),
    ("In Python, which keyword is used to define an asynchronous function?", "async def"),
    ("What is 15 multiplied by 8?", "120"),
    ("What does HTTP stand for?", "HyperText Transfer Protocol")
]


def run_cli():
    print("\n" + "=" * 60)
    print("⚡ JEV INTERACTIVE ANSWER VERIFIER (CLI MODE)")
    print("=" * 60)
    print("Answer questions and see Jev calculate probability in real time.\n")

    for idx, (question, expected) in enumerate(QUESTIONS, start=1):
        print(f"\n[Question {idx}/5]: {question}")
        try:
            user_answer = input("Your Answer: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if not user_answer:
            print("Skipped.")
            continue

        result = engine.evaluate_answer(question, expected, user_answer)
        v = result["verdict"]
        prims = result["primitives"]
        noul = prims["noul"]
        choice = prims["choice"]
        score = prims["score"]

        # Formatted Verdict Output
        if choice["winner"] == "correct":
            print(f"\n  ✅ VERDICT: CORRECT ({v['confidence_percent']}% certainty)")
        elif choice["winner"] == "partially_correct":
            print(f"\n  ⚠️ VERDICT: PARTIALLY CORRECT ({v['confidence_percent']}% match)")
        else:
            print(f"\n  ❌ VERDICT: INCORRECT ({v['confidence_percent']}% confidence)")
            print(f"     Expected answer was: '{expected}'")

        print("  " + "-" * 50)
        print("  [Jev Primitives Probability Breakdown]")
        print(f"  • Noul (Is Correct?):    {noul['probability'] * 100:.1f}% probability (p = {noul['probability']:.4f})")
        print(f"  • Choice (Category):     {choice['winner'].upper()} (Winner)")
        print(f"                           [Correct: {choice['probabilities']['correct']*100:.1f}% | Partial: {choice['probabilities']['partially_correct']*100:.1f}% | Incorrect: {choice['probabilities']['incorrect']*100:.1f}%]")
        print(f"  • Score (Quality Rating): {score['score']:.2f} / 2.00 continuous scale")
        print("  " + "-" * 50)

    print("\n[+] Done testing Jev CLI!")


if __name__ == "__main__":
    run_cli()
