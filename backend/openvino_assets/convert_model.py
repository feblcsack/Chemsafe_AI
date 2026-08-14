"""
Run this ONCE, offline, to convert best.onnx into OpenVINO IR (.xml/.bin).
Output goes into this same folder and is read by routers/openvino_infer.py.

Usage:
    pip install openvino-dev
    python convert_model.py /path/to/best.onnx
"""
import sys
import os
from openvino.tools import mo
from openvino.runtime import serialize

def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_model.py /path/to/best.onnx")
        sys.exit(1)

    onnx_path = sys.argv[1]
    out_dir = os.path.dirname(__file__)

    ov_model = mo.convert_model(onnx_path, compress_to_fp16=True)
    serialize(ov_model, os.path.join(out_dir, "best.xml"))
    print(f"Converted. Output: {os.path.join(out_dir, 'best.xml')} (+ .bin)")

if __name__ == "__main__":
    main()
