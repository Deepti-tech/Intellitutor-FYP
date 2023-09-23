# import pymongo
# import matplotlib.pyplot as plt
# from flask import send_file
# # client = pymongo.MongoClient("mongodb://localhost:27017/")
# # db = client["capstone"]

# def ana(data):
#     # client = pymongo.MongoClient('mongodb+srv://singhdeepti311:bps@cluster0.n60nby8.mongodb.net/?retryWrites=true&w=majority')
#     # db = client['capstone']
#     # collection = db["user_practice_interviews"]
#     # data = []
#     # for document in collection.find():
#     #     data.append(document["audio_score"])
#     # data2 = []
#     # for document in collection.find():
#     #     data2.append(document["video_score"])
#     # print(data2)
#     # Assuming data is a list of numeric values
#     plt.plot(data, label = 'Audio Score', color = 'Red')
#     # plt.plot(data2, label = 'Video Score', color = 'Green')
#     plt.xlabel("No")
#     plt.ylabel("Score")
#     plt.title("Analysis")
#     plt.legend()
#     plt.show()
#     plt.savefig('path_to_save_plot.png')
#     return send_file('path_to_save_plot.png', mimetype='image/png')