import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { heapNew, heapLength, heapPush, heapPop } from "../utils/heap";

import Layout from "../components/layout";
import SEO from "../components/seo";

const CONTRIBUTORS_API =
  "https://api.github.com/repos/BUGS-NYU/bugs-nyu.github.io/contributors";

function parseDate(timestamp) {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const timestr = new Date(date.setSeconds(0, 0)).toLocaleTimeString();
  const times = timestr.split(" ");
  const hour = times[0];
  return `${month}/${day}/${year} ${hour}`;
}

const Contributors = () => {
  const [PRList, setPRList] = useState([]);
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    const fetchData = async (url, name) => {
      const data = await fetch(url);
      return [await data.json(), name, 0];
    };

    const promises = [
      fetchData(
        "https://api.github.com/repos/BUGS-NYU/bugs-nyu.github.io/pulls?state=closed&sort=created&direction=DESC",
        "the BUGS Website"
      ),
      fetchData(
        "https://api.github.com/repos/BUGS-NYU/schedge/pulls?state=closed&sort=created&direction=DESC",
        "Schedge"
      ),
      fetchData(
        "https://api.github.com/repos/BUGS-NYU/freshman-schedge-generator/pulls?state=closed&sort=created&direction=DESC",
        "Alberta"
      ),
    ];

    const comp = (a, b) => {
      const aData = a[0],
        aIdx = a[2];
      const bData = b[0],
        bIdx = b[2];

      return (
        new Date(bData[bIdx].created_at) - new Date(aData[aIdx].created_at)
      );
    };

    const contributorObjects = data =>
      data
        .map(({ avatar_url, html_url, login }) => ({
          image: avatar_url,
          url: html_url,
          name: login,
        }))
        .filter(item => item.name !== "dependabot[bot]");

    (async () => {
      const data = await Promise.all(promises);
      const heap = heapNew(comp);

      data.forEach(item => heapPush(heap, item));

      const pullRequests = [];
      while (heapLength(heap) > 0) {
        const [pData, project, idx] = heapPop(heap);
        const item = pData[idx];

        if (item.merged_at === undefined) {
          if (idx + 1 < pData.length) heapPush(heap, [pData, project, idx + 1]);
          continue;
        }

        const user = item.user.login;
        if (user.includes("dependabot")) {
          if (idx + 1 < pData.length) heapPush(heap, [pData, project, idx + 1]);
          continue;
        }

        const createdTime = item.created_at;
        const prURL = item["html_url"];

        pullRequests.push({
          user: user,
          url: prURL,
          timestamp: parseDate(createdTime),
          name: project,
          text: `${user} merged a Pull Request into ${project}!`,
        });

        if (idx + 1 < pData.length) heapPush(heap, [pData, project, idx + 1]);
      }

      pullRequests.unshift({
        timestamp: "NOW",
        url: "https://github.com/BUGS-NYU",
        user: "",
        text: "Make this your contribution!",
      });

      setPRList(pullRequests);
    })();

    (async () => {
      const res = await fetch(CONTRIBUTORS_API);
      const data = await res.json();
      const contributors = contributorObjects(data);
      setContributors(contributors);
    })();
  }, []);

  const ContributorsList = () =>
    contributors.map(({ name, image, url }) => (
      <a key={name} href={url}>
        <Image alt={name} src={image} />
      </a>
    ));

  return (
    <Layout>
      <SEO title="Contributors" />
      <MainContainer>
        <PageContainer>
          <MainPage>
            <ContributorContainer>
              <Title>
                <BoldText>Contributors</BoldText>
              </Title>
              {contributors.length !== 0 ? (
                <ImageContainer>
                  <ContributorsList />
                </ImageContainer>
              ) : (
                <Loading />
              )}
            </ContributorContainer>
            <TimelineContainer>
              <Title>
                Our <BoldText>Open Source </BoldText> Timeline
              </Title>
              {PRList.length !== 0 ? (
                <Timeline>
                  {PRList.map((PR, index) => {
                    if (index % 2 === 0) {
                      return (
                        <LeftContainer key={PR.url}>
                          <Time>{PR.timestamp}</Time>
                          <ContentURL href={PR.url}>
                            <Content>{PR.text}</Content>
                          </ContentURL>
                        </LeftContainer>
                      );
                    } else {
                      return (
                        <RightContainer key={PR.url}>
                          <Time>{PR.timestamp}</Time>
                          <ContentURL href={PR.url}>
                            <Content>{PR.text}</Content>
                          </ContentURL>
                        </RightContainer>
                      );
                    }
                  })}
                </Timeline>
              ) : (
                <Loading />
              )}
            </TimelineContainer>
          </MainPage>
        </PageContainer>
      </MainContainer>
    </Layout>
  );
};

const scalein = keyframes`
  from {
    transform: scale(0.9)
  },
  to {
    transform: scale(1)
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const MainContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
`;

const PageContainer = styled.article`
  display: block;
`;

const MainPage = styled.section`
  margin-top: 10%;
  align-items: center;
  min-height: 100vh;
  padding-right: 3vw;
  padding-left: 3vw;
  display: flex;
  justify-items: stretch;
  margin-bottom: 5%;
  flex-direction: column;
  margin-top: 0;
  padding-bottom: 10vh;
  padding-top: 12vh;
  align-items: center;
`;

const ContributorContainer = styled.div`
  height: auto;
  display: flex;
  flex-direction: column;
  padding: 0px 5px 0px 5px;
  max-width: 1200px;
  align-items: center;
  margin: 0px 0px 70px 0px;
  @media screen and (max-width: 1300px) {
    width: 100%;
    margin: 0px 0px 50px 0px;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-start;
`;

const Title = styled.h1`
  text-align: center;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 0em;
  text-transform: none;
  line-height: 1.2;
  font-size: calc(1vw + 1.5rem);
  color: rgba(255, 255, 255, 0.7);
  animation: ${scalein} 1s;
`;

const Image = styled.img`
  border-radius: 50%;
  width: 5em;
  height: 5em;
  margin: 0.3em;
  @media screen and (max-width: 1300px) {
    width: 4.8em;
    height: 4.8em;
  }
`;

const TimelineContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  @media screen and (max-width: 1300px) {
    width: 100%;
    margin: 0px 0px 0px 0px;
  }
`;

const slideLeft = keyframes`
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
`;

const Timeline = styled.div`
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  animation: 1s ease-in-out 0s 1 ${slideLeft};
  &::after {
    content: "";
    position: absolute;
    width: 6px;
    background-color: white;
    top: 0;
    bottom: 0;
    left: 50%;
    margin-left: -3px;
  }

  @media screen and (max-width: 1300px) {
    &::after {
      left: 31px;
    }
  }
`;

const LeftContainer = styled.div`
  padding: 10px 40px;
  position: relative;
  background-color: inherit;
  width: 50%;
  left: -13.5%;

  &::after {
    content: "";
    position: absolute;
    width: 25px;
    height: 25px;
    right: -17px;
    background-color: white;
    border: 4px solid var(--color-contributionCircle);
    top: 15px;
    border-radius: 50%;
    z-index: 1;
  }

  @media screen and (max-width: 1300px) {
    width: 60%;
    padding-left: 70px;
    padding-right: 25px;
    left: 0%;

    &::after {
      left: 15px;
    }
  }
`;

const RightContainer = styled.div`
  padding: 10px 40px;
  position: relative;
  background-color: inherit;
  width: 50%;
  left: 50%;

  &::after {
    content: "";
    transition: all 0.2s linear;
    position: absolute;
    width: 25px;
    height: 25px;
    right: -17px;
    background-color: white;
    border: 4px solid var(--color-contributionCircle);
    top: 15px;
    border-radius: 50%;
    z-index: 1;
  }

  &::after {
    left: -16px;
  }

  @media screen and (max-width: 1300px) {
    width: 60%;
    padding-left: 70px;
    padding-right: 25px;
    left: 0%;

    &::after {
      left: 15px;
    }
  }
`;

const Time = styled.p`
  text-align: center;
  font-weight: 500;
  color: white;
  margin: 0;
  padding: 2px 0px 0px 0px;
  @media screen and (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const ContentURL = styled.a`
  text-decoration: none;
`;

const Content = styled.p`
  padding: 20px 30px;
  position: relative;
  border-radius: 6px;
  color: white;
  box-shadow: 0px 0px 0px 3px white;
  transition: all 0.2s linear;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0px 0px 0px 3px var(--color-contributionContent);
  }
`;

const BoldText = styled.strong`
  color: white;
`;

const Loading = styled.div`
  z-index: 1;
  width: 150px;
  height: 150px;
  border: 10px solid #f5f5f5;
  border-radius: 50%;
  border-top: 10px solid purple;
  width: 80px;
  height: 80px;
  animation: ${spin} 2s linear infinite;
  @media screen and (max-width: 1300px) {
    width: 60px;
    height: 60px;
    border: 5px solid #f5f5f5;
    border-top: 5px solid purple;
  }
`;

export default Contributors;
