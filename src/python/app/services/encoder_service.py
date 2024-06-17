from adapters import AutoAdapterModel
from transformers import AutoTokenizer
import logging
from os.path import abspath

logger = logging.getLogger(__name__)
logger.setLevel(logging.CRITICAL)

encoder_data_path = abspath('/code/data/encoder_data')
model_adapter_data_path = abspath('/code/data/model_adapter_data')

tokenizer: AutoTokenizer
model: AutoAdapterModel

tokenizer = AutoTokenizer.from_pretrained(encoder_data_path)
model = AutoAdapterModel.from_pretrained(encoder_data_path)

model.load_adapter(
    model_adapter_data_path,
    source="hf",
    model_name="specter2_base",
    load_as="allenai/specter2_adhoc_query",
    set_active=True,
)

def get_embeddings(query_string: str) -> list[float]:
    inputs = tokenizer(
        query_string,
        return_tensors="pt",
        return_token_type_ids=False,
    )

    output = model(**inputs)
    # take the first token in the batch as the embedding
    target_embeddings = output.last_hidden_state[:, 0, :]
    return target_embeddings.tolist()[0]
