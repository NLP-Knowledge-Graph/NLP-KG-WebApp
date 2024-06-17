FROM python:3.11
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --root-user-action=ignore https://github.com/kpu/kenlm/archive/master.zip
RUN pip install --root-user-action=ignore --no-cache-dir --upgrade -r /code/requirements.txt
RUN rm -rf /root/.cache/
COPY ./app /code/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]