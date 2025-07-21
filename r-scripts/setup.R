
############# r5r
# https://ipeagit.github.io/r5r/articles/r5r.html
# For processing polylines into isochrones

install.packages('r5r')
install.packages("rJavaEnv")

# r5r runs on Java, setup below. 
rJavaEnv::rje_consent(provided = TRUE)
rJavaEnv::java_quick_install(version = 21)
rJavaEnv::java_check_version_rjava()

# At the TOP of the script (even before library calls), allocate 2GB of memory like this:
options(java.parameters = "-Xmx2G")



############## osmextract 
# https://docs.ropensci.org/osmextract/
# For pulling street polylines

install.packages('osmextract')


