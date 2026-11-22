import io
import json
import sys
from contextlib import redirect_stdout
from pipeline import run_research_pipeline

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


class StreamTee(io.TextIOBase):
    """Forwards live print() lines from pipeline.py immediately in UTF-8."""
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

    print("\n__FINAL_STATE_JSON__")
    print(json.dumps(state, ensure_ascii=False), flush=True)