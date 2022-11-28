import os.path

##User input to get filename. Edit output directory here as well.
input_table_url = raw_input("Input filename: ")
output_file_url = raw_input("Output filename: ")
directory = "../../Assets/Data/static_data_sources/"

print "CZML file will be outputted at " + directory + output_file_url + ".czml"
print "directory relative to this script"

##Probably change this from test_name at some point as well.
out_file = """[{ \
\n \t "id" : "document", \
\n \t "name" : "test name", \
\n \t "version" : "1.0" \
\n }"""

##Given an index, get the information from the row in the table and generate the czml string
def new_item(item_id, tr):
    name = tr[0].strip('"')
    description = tr[1]
    image_url = tr[2]
    label_text = tr[3]
    lon = tr[4]
    lat = tr[5]
    height = tr[6]
    czml_string = """,\n \n \t { \
    \n \t "id" : """ + '"' + item_id + '"' + """,\
    \n \t "name" : """ + '"' + name + '"' """, \
    \n \t "description" : """ + '"' + description + '"' + """,\
    \n \t "billboard" : { \
    \n \t \t "image" : """ + '"' + image_url + '"' + """,\
    \n \t \t "scale" : "0.5" \
    \n \t }, \
    \n \t "label" : { \
    \n \t \t "fillColor" : { \
    \n \t \t \t "rgba" : [255, 255, 255, 255] \
    \n \t \t }, \
    \n \t \t "font" : "12pt Lucida Console", \
    \n \t \t "horizontalOrigin" : "LEFT", \
    \n \t \t "pixelOffset" : { \
    \n \t \t \t "cartesian2" : [15, 0] \
    \n \t \t }, \
    \n \t \t "style" : "FILL", \
    \n \t \t "text" : """ + '"' + label_text + '"' + """, \
    \n \t \t "showBackground" : true,\
    \n \t \t "backgroundColor" : {\
    \n \t \t \t "rgba" : [112, 89, 57, 200]\
    \n \t \t } \
    \n \t },\
    \n \t "position" : {\
    \n \t \t "cartographicDegrees" : [""" + lon + ", " + lat + ", " + height + """]\
    \n \t }\
    \n \t }"""
    return czml_string


index = 0

##error handling. Won't run if it can't open the file.
try:
    f = open(input_table_url, "r")
    lines = f.read().split("\n")
    for line in lines:
        if line != "":  # rubbish index to skip the first line which contains titles.
            cols = line.split("\t")
            if index != 0:
                out_file += new_item(str(index), cols)
            index += 1

    out_file += '\n ]'

    with open(os.path.join(directory, str(output_file_url) + ".czml"), "wt") as text_file:
        text_file.write(out_file)

except IOError:
    print "IO error reading file. Check input filename is correct."
    pass
