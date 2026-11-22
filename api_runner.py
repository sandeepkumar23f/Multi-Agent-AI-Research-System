import io
import json
import sys
from contextlib import redirect_stdout
from pipeline import run_research_pipeline


class StreamTee(io.TextIOBase):
    """Forwards live print() lines from pipeline.py immediately while capturing them."""
    def write(self, s):
        sys.__stdout__.write(s)
        sys.__stdout__.flush()
        return len(s)


if __name__ == "__main__":
    topic = " ".join(sys.argv[1:]).strip()
    if not topic:
        sys.exit(1)

    with redirect_stdout(StreamTee()):
        state = run_research_pipeline(topic)

    # Emit final state dictionary with a unique delimiter for Node.js
    print("\n__FINAL_STATE_JSON__")
    print(json.dumps(state), flush=True)