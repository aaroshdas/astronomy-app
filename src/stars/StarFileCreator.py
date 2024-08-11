def create_word_list(filename):
    with open ('stars.txt','a', encoding="utf8") as w:
        with open (filename, encoding="utf8") as f:
            for line in f:
                lineList = line.strip().split(",")
                text = (lineList[0] +","+lineList[4]+","+ lineList[5]+","+lineList[2]+","+lineList[3]+"\n")
                w.write(text)
    print("complete")
create_word_list('Messier.csv')

print("file done running")