import requests
from nltk.corpus import stopwords 
import nltk
nltk.download('stopwords')

def text_sentiment():
    file1 = open("output\\text.txt", "r")
    data = file1.readlines()
    file1.close()

    # Convert stopwords to a list
    stopwords_list = set(stopwords.words('english'))

    output = []
    for sentence in data:
        temp_list = []
        for word in sentence.split():
            if word.lower() not in stopwords_list:
                temp_list.append(word)
        output.append(' '.join(temp_list))

    r = requests.post(
        "https://api.deepai.org/api/sentiment-analysis",
        data={
            'text': output,
        },
        headers={'api-key': '19735117-4450-461c-8aa0-5080d6de37ff'}
    )

    # Print the entire JSON response to see its structure
    print(r.json())

text_sentiment()
