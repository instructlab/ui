from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel
from docling.document_converter import DocumentConverter


app = FastAPI()

class UrlRequest(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"Docling Service is up and running."}


@app.post("/simpleconvert")
def simpleconvert(request: UrlRequest):
    url = request.url
    converter = DocumentConverter()
    doc = converter.convert_single(url)
    print(doc.render_as_markdown())
    return {doc.render_as_markdown()}