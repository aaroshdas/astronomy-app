def create_word_list(filename):
    with open ('city-list-countries.txt','a', encoding="utf8") as w:
        with open (filename, encoding="utf8") as f:
            for line in f:
                lineList = line.split(",")
                text = (lineList[0][1:-1].strip().upper()+","+str(lineList[2][1:-1].strip()) + ","+str(lineList[3][1:-1].strip())+","+str(lineList[4][1:-1].strip()) +"\n")    
                w.write(text)
              
    print("complete")
create_word_list('worldcities.csv')

print("file done running")